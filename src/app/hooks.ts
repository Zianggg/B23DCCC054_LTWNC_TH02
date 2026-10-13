import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store'

/** Typed hooks — mọi component chỉ import 2 hook này, không dùng useDispatch/useSelector gốc. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
