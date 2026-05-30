import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultCategories } from '../data/defaultData';
import { todayISO } from '../domain/finance';
import { TransactionForm } from './TransactionForm';

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000001')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000002')
      .mockReturnValue('00000000-0000-4000-8000-000000000003');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults the transaction date to today', () => {
    render(<TransactionForm categories={defaultCategories} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('วันที่')).toHaveValue(todayISO());
  });

  it('shows validation errors for empty category and invalid amount', async () => {
    const user = userEvent.setup();
    render(<TransactionForm categories={defaultCategories} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));

    expect(screen.getByRole('alert')).toHaveTextContent('กรุณาเลือกหมวดหมู่');
    expect(screen.getByRole('alert')).toHaveTextContent('จำนวนเงินต้องมากกว่า 0');
  });

  it('lets users record savings with savings categories', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TransactionForm categories={defaultCategories} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'ออมเงิน' }));
    await user.selectOptions(screen.getByLabelText('หมวดหมู่'), screen.getByRole('option', { name: 'เงินออม' }));
    await user.type(screen.getByLabelText('จำนวนเงิน'), '2500');
    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: 'savings',
      categoryId: 'savings',
      amount: 2500,
      clientRequestId: '00000000-0000-4000-8000-000000000001',
    }));
  });

  it('keeps the same idempotency key when a save fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<TransactionForm categories={defaultCategories} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('หมวดหมู่'), 'food');
    await user.type(screen.getByLabelText('จำนวนเงิน'), '85');
    await user.type(screen.getByLabelText('โน้ต'), 'ลาเต้');
    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));
    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenNthCalledWith(1, expect.objectContaining({ clientRequestId: '00000000-0000-4000-8000-000000000001' }));
    expect(onSubmit).toHaveBeenNthCalledWith(2, expect.objectContaining({ clientRequestId: '00000000-0000-4000-8000-000000000001' }));
    expect(screen.getByLabelText('จำนวนเงิน')).toHaveValue(85);
    expect(screen.getByLabelText('โน้ต')).toHaveValue('ลาเต้');
  });

  it('blocks duplicate clicks while a transaction save is pending', async () => {
    const user = userEvent.setup();
    let resolveSubmit: (saved: boolean) => void = () => undefined;
    const onSubmit = vi.fn(
      () => new Promise<boolean>((resolve) => {
        resolveSubmit = resolve;
      }),
    );
    render(<TransactionForm categories={defaultCategories} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('หมวดหมู่'), 'food');
    await user.type(screen.getByLabelText('จำนวนเงิน'), '85');
    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));
    await user.click(screen.getByRole('button', { name: 'กำลังบันทึก' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => resolveSubmit(true));

    expect(screen.getByRole('button', { name: 'เพิ่มรายการ' })).toBeEnabled();
    expect(screen.getByLabelText('จำนวนเงิน')).toHaveValue(null);
  });

  it('rotates the idempotency key after a successful save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<TransactionForm categories={defaultCategories} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('หมวดหมู่'), 'food');
    await user.type(screen.getByLabelText('จำนวนเงิน'), '85');
    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));
    await user.type(screen.getByLabelText('จำนวนเงิน'), '90');
    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการ' }));

    expect(onSubmit).toHaveBeenNthCalledWith(1, expect.objectContaining({ clientRequestId: '00000000-0000-4000-8000-000000000001' }));
    expect(onSubmit).toHaveBeenNthCalledWith(2, expect.objectContaining({ clientRequestId: '00000000-0000-4000-8000-000000000002' }));
  });

  it('marks the transaction type selector as a full-row control above the fields', () => {
    render(<TransactionForm categories={defaultCategories} onSubmit={vi.fn()} />);

    const form = screen.getByRole('form', { name: 'เพิ่มรายการ' });
    const typeSelector = screen.getByLabelText('ประเภทรายการ');
    const fieldsRow = screen.getByRole('group', { name: 'ข้อมูลรายการ' });

    expect(form).toHaveClass('transaction-form');
    expect(form.firstElementChild).toBe(typeSelector);
    expect(typeSelector.nextElementSibling).toBe(fieldsRow);
    expect(typeSelector).toHaveClass('transaction-type-control', 'transaction-type-control-full');
    expect(fieldsRow).toHaveClass('transaction-fields-row');
    expect(screen.getByLabelText('โน้ต').closest('label')).toHaveClass('transaction-note-field');
    expect(screen.getByRole('button', { name: 'เพิ่มรายการ' })).toHaveClass('transaction-submit-button', 'transaction-row-action');
  });
});
