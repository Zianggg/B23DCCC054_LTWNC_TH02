import { useId, useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useForm } from '@/shared/hooks/useForm'
import { PRIORITY_LABELS, isPriority, type CreateAssignmentDto, type Priority } from '@/types'
import { addAssignment } from './assignmentsSlice'

const INITIAL_FORM: CreateAssignmentDto = {
  course: '',
  title: '',
  dueDate: '',
  priority: 'medium',
}

const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[]

type FormErrors = Partial<Record<keyof CreateAssignmentDto, string>>

export function validateAssignment(values: CreateAssignmentDto): FormErrors {
  const errors: FormErrors = {}
  if (!values.course.trim()) errors.course = 'Nhập tên môn học.'
  if (!values.title.trim()) errors.title = 'Nhập tên bài tập.'
  if (!values.dueDate) errors.dueDate = 'Chọn hạn nộp.'
  return errors
}

interface AssignmentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignmentForm({ onSuccess, onCancel }: AssignmentFormProps) {
  const dispatch = useAppDispatch()
  const { values, setField, reset } = useForm<CreateAssignmentDto>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const id = useId()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateAssignment(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    dispatch(
      addAssignment({
        course: values.course.trim(),
        title: values.title.trim(),
        dueDate: values.dueDate,
        priority: values.priority,
      }),
    )
    reset()
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Thêm bài tập" className="flex flex-col gap-6">
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.course)}>
          <FieldLabel htmlFor={`${id}-course`}>Môn học</FieldLabel>
          <Input
            id={`${id}-course`}
            name="course"
            placeholder="Lập trình web nâng cao"
            aria-invalid={Boolean(errors.course)}
            aria-describedby={errors.course ? `${id}-course-error` : undefined}
            value={values.course}
            onChange={(event) => setField('course', event.target.value)}
          />
          <FieldError id={`${id}-course-error`}>{errors.course}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor={`${id}-title`}>Tên bài tập</FieldLabel>
          <Input
            id={`${id}-title`}
            name="title"
            placeholder="Bài thực hành 02"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? `${id}-title-error` : undefined}
            value={values.title}
            onChange={(event) => setField('title', event.target.value)}
          />
          <FieldError id={`${id}-title-error`}>{errors.title}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.dueDate)}>
            <FieldLabel htmlFor={`${id}-due`}>Hạn nộp</FieldLabel>
            <Input
              id={`${id}-due`}
              name="dueDate"
              type="date"
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? `${id}-due-error` : undefined}
              value={values.dueDate}
              onChange={(event) => setField('dueDate', event.target.value)}
            />
            <FieldError id={`${id}-due-error`}>{errors.dueDate}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${id}-priority`}>Mức ưu tiên</FieldLabel>
            <NativeSelect
              id={`${id}-priority`}
              name="priority"
              className="w-full"
              value={values.priority}
              onChange={(event) => {
                if (isPriority(event.target.value)) setField('priority', event.target.value)
              }}
            >
              {PRIORITIES.map((key) => (
                <NativeSelectOption key={key} value={key}>
                  {PRIORITY_LABELS[key]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        ) : null}
        <Button type="submit">Thêm bài tập</Button>
      </div>
    </form>
  )
}
