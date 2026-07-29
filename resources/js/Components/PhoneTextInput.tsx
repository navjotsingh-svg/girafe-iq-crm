import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import { usePage } from '@inertiajs/react';

type PhoneConfig = {
    min_digits?: number;
    max_digits?: number;
    max_chars?: number;
};

/**
 * Phone input with shared digit-length constraints (10–15 by default).
 */
export default forwardRef(function PhoneTextInput(
    {
        className = '',
        isFocused = false,
        required = false,
        onChange,
        onBlur,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);
    const phone = (
        usePage().props as { app?: { phone?: PhoneConfig } }
    ).app?.phone;

    const minDigits = phone?.min_digits ?? 10;
    const maxDigits = phone?.max_digits ?? 15;
    const maxChars = phone?.max_chars ?? 30;

    const applyValidity = (value: string) => {
        const el = localRef.current;
        if (!el) {
            return;
        }
        const digits = value.replace(/\D+/g, '');
        if (digits.length === 0 && !required) {
            el.setCustomValidity('');
        } else if (digits.length < minDigits || digits.length > maxDigits) {
            el.setCustomValidity(
                `Phone must contain between ${minDigits} and ${maxDigits} digits.`,
            );
        } else if (!/^[0-9+\-\s().]*$/.test(value.trim())) {
            el.setCustomValidity(
                'Phone may only contain digits and + - ( ) . spaces.',
            );
        } else {
            el.setCustomValidity('');
        }
    };

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type="tel"
            inputMode="tel"
            autoComplete={props.autoComplete ?? 'tel'}
            maxLength={maxChars}
            required={required}
            title={`Enter ${minDigits}–${maxDigits} digits (spaces, +, - allowed)`}
            placeholder={props.placeholder ?? `${minDigits}–${maxDigits} digit number`}
            className={
                'rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ' +
                className
            }
            ref={localRef}
            onChange={(e) => {
                applyValidity(e.target.value);
                onChange?.(e);
            }}
            onBlur={(e) => {
                applyValidity(e.target.value);
                onBlur?.(e);
            }}
        />
    );
});
