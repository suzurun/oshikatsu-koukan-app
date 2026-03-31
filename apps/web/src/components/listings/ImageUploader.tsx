'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploaderProps {
  onUploaded: (urls: string[]) => void
  onAnalyzeRequest: (primaryUrl: string) => void
  maxImages?: number
}

export function ImageUploader({
  onUploaded,
  onAnalyzeRequest,
  maxImages = 10,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUploading(true)
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const ext = file.name.split('.').pop()
        const path = `listings/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
          .from('listing-images')
          .upload(path, file, { upsert: false })

        if (!error) {
          const { data } = supabase.storage
            .from('listing-images')
            .getPublicUrl(path)
          uploadedUrls.push(data.publicUrl)
          setPreviews((prev) => [...prev, data.publicUrl])
        }
      }

      setUploading(false)
      onUploaded(uploadedUrls)

      if (uploadedUrls[0]) {
        onAnalyzeRequest(uploadedUrls[0])
      }
    },
    [onUploaded, onAnalyzeRequest],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (previews.length < maxImages) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [previews.length, maxImages, uploadFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) uploadFiles(e.target.files)
    },
    [uploadFiles],
  )

  const removeImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* アップロードエリア */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => document.getElementById('image-input')?.click()}
      >
        <input
          id="image-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="text-4xl mb-2">📷</div>
        {uploading ? (
          <p className="text-gray-500">アップロード中...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">写真をドラッグ＆ドロップ</p>
            <p className="text-gray-400 text-sm mt-1">
              またはクリックして選択（最大{maxImages}枚）
            </p>
            <p className="text-primary-500 text-xs mt-2 font-medium">
              ✨ 1枚目の写真をAIが自動で相場分析します
            </p>
          </>
        )}
      </div>

      {/* プレビューグリッド */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {previews.map((url, i) => (
            <div key={url} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`商品画像${i + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">
                  メイン
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs
                           opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {previews.length < maxImages && (
            <button
              type="button"
              onClick={() => document.getElementById('image-input')?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg
                         flex items-center justify-center text-gray-400 hover:border-primary-400 transition-colors"
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  )
}
