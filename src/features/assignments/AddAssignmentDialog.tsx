import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AssignmentForm } from './AssignmentForm'

export function AddAssignmentDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Thêm bài tập
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-semibold">Thêm bài tập</DialogTitle>
          <DialogDescription>Bài mới nằm ở đầu danh sách và được tính vào thống kê.</DialogDescription>
        </DialogHeader>
        <AssignmentForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
