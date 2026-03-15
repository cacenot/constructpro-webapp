import { useApiClient, useSale } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { FileText, Info, Loader2, Paperclip, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { storage } from '@/lib/firebase'
import { cn, formatId } from '@/lib/utils'

const signContractSchema = z.object({
  document_url: z.string().url('URL inválida').or(z.literal('')).optional(),
})

type SignContractFormData = z.infer<typeof signContractSchema>
type DocMode = 'url' | 'file'

interface SignContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: number
}

export function SignContractDialog({ open, onOpenChange, saleId }: SignContractDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const [docMode, setDocMode] = useState<DocMode>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: sale, isLoading } = useSale(saleId)
  const contractId = sale?.contract?.id

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignContractFormData>({
    resolver: zodResolver(signContractSchema),
    defaultValues: { document_url: '' },
  })

  async function uploadFile(file: File, cid: number): Promise<string> {
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageRef = ref(storage, `contracts/${cid}/${timestamp}_${safeName}`)

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file)
      task.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        }
      )
    })
  }

  const mutation = useMutation({
    mutationFn: async (data: SignContractFormData) => {
      if (!contractId) throw new Error('Contrato não encontrado')

      let documentUrl: string | undefined = data.document_url || undefined

      if (docMode === 'file' && selectedFile) {
        setIsUploading(true)
        setUploadProgress(0)
        try {
          documentUrl = await uploadFile(selectedFile, contractId)
        } finally {
          setIsUploading(false)
        }
      }

      const { data: response, error } = await client.POST('/api/v1/contracts/{contract_id}/sign', {
        params: { path: { contract_id: contractId } },
        body: { document_url: documentUrl },
      })

      if (error) {
        const detail = (error as { detail?: string }).detail
        throw new Error(detail || 'Falha ao assinar contrato')
      }

      return response
    },
    onSuccess: () => {
      toast.success('Contrato assinado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      reset()
      setSelectedFile(null)
      setUploadProgress(0)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao assinar contrato')
    },
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))
  const isPending = mutation.isPending || isUploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Assinar Contrato
          </DialogTitle>
          <DialogDescription>Proposta {formatId(saleId)}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !contractId ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Contrato não encontrado para esta proposta.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Após a assinatura, a venda será fechada ou movida para aguardando pagamento do
                sinal, conforme a configuração do tenant.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label>Documento do contrato (opcional)</Label>

                {/* Mode toggle */}
                <div className="flex gap-1 rounded-lg border p-1">
                  <button
                    type="button"
                    onClick={() => setDocMode('url')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      docMode === 'url'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Paperclip className="size-3.5" />
                    Link externo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocMode('file')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      docMode === 'file'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Upload className="size-3.5" />
                    Upload de arquivo
                  </button>
                </div>

                {docMode === 'url' ? (
                  <div className="space-y-1.5">
                    <Input
                      id="document_url"
                      type="url"
                      placeholder="https://app.d4sign.com.br/... ou outro link"
                      {...register('document_url')}
                    />
                    {errors.document_url && (
                      <p className="text-sm text-red-600">{errors.document_url.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Link para plataforma de assinatura (D4Sign, DocuSign) ou PDF externo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                        selectedFile
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-8 text-muted-foreground" />
                      {selectedFile ? (
                        <>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB — clique para trocar
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Clique para selecionar</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX até 20 MB</p>
                        </>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                    {isUploading && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Enviando arquivo...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {isUploading ? 'Enviando...' : 'Assinando...'}
                    </>
                  ) : (
                    'Confirmar Assinatura'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
