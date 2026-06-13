import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  getSelectableCategories,
  parseAmountExpression,
  sanitizeAmountExpression,
  todayISO,
  validateTransactionInput,
} from '../domain/finance';
import type { Category, TransactionInput, TransactionType } from '../types';

type Props = {
  categories: Category[];
  onSubmit: (input: TransactionInput) => boolean | Promise<boolean>;
};

export function TransactionForm({ categories, onSubmit }: Props) {
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectableCategories = useMemo(
    () => getSelectableCategories(categories, type),
    [categories, type],
  );

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategoryId('');
  }

  function normalizeAmount() {
    if (!/[+\-*/xX]/.test(amount)) return;

    const parsedAmount = parseAmountExpression(amount);
    if (Number.isFinite(parsedAmount)) {
      setAmount(String(parsedAmount));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedAmount = parseAmountExpression(amount);
    if (Number.isFinite(parsedAmount)) {
      setAmount(String(parsedAmount));
    }

    const input: TransactionInput = {
      type,
      categoryId,
      amount: parsedAmount,
      date,
      note: note.trim(),
      clientRequestId,
    };
    const nextErrors = validateTransactionInput(input);

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    let saved = false;
    try {
      saved = await onSubmit(input);
    } finally {
      setIsSubmitting(false);
    }
    if (!saved) return;

    setAmount('');
    setNote('');
    setErrors([]);
    setClientRequestId(crypto.randomUUID());
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit} aria-label="เพิ่มรายการ" noValidate>
      <div className="segmented transaction-type-control transaction-type-control-full" aria-label="ประเภทรายการ">
        <button
          type="button"
          className={type === 'expense' ? 'active' : ''}
          aria-pressed={type === 'expense'}
          onClick={() => handleTypeChange('expense')}
        >
          รายจ่าย
        </button>
        <button
          type="button"
          className={type === 'income' ? 'active' : ''}
          aria-pressed={type === 'income'}
          onClick={() => handleTypeChange('income')}
        >
          รายรับ
        </button>
        <button
          type="button"
          className={type === 'savings' ? 'active' : ''}
          aria-pressed={type === 'savings'}
          onClick={() => handleTypeChange('savings')}
        >
          ออมเงิน
        </button>
      </div>

      <div className="transaction-fields-row" role="group" aria-label="ข้อมูลรายการ">
        <label>
          หมวดหมู่
          <select
            aria-label="หมวดหมู่"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">เลือกหมวดหมู่</option>
            {selectableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          จำนวนเงิน
          <input
            aria-label="จำนวนเงิน"
            inputMode="decimal"
            pattern="[0-9.+*/xX -]*"
            required
            type="text"
            value={amount}
            onChange={(event) => setAmount(sanitizeAmountExpression(event.target.value))}
            onBlur={normalizeAmount}
            placeholder="0"
          />
        </label>

        <label>
          วันที่
          <input
            aria-label="วันที่"
            required
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <label className="transaction-note-field">
          โน้ต
          <input
            aria-label="โน้ต"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="เช่น ข้าวกลางวัน"
          />
        </label>

        <button
          className="primary-button transaction-submit-button transaction-row-action"
          disabled={isSubmitting}
          type="submit"
        >
          <Plus size={18} />
          {isSubmitting ? 'กำลังบันทึก' : 'เพิ่มรายการ'}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="form-errors" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </form>
  );
}
