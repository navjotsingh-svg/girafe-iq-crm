import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo({
    className = '',
    alt = 'Girafe IQ',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo.png"
            alt={alt}
            className={`object-contain ${className}`}
            {...props}
        />
    );
}
