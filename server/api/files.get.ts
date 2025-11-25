// Get list of uploaded files
import { uploadedFiles } from './upload.post'
import type { UploadedFile } from '~/types/file'

export default defineEventHandler((): UploadedFile[] => {
  return Array.from(uploadedFiles.values())
})
