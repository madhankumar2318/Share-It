import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const WhatsAppIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.32C9.37 7.32 9.12 7.38 8.9 7.62C8.68 7.86 8.07 8.43 8.07 9.59C8.07 10.74 8.92 11.86 9.04 12.02C9.16 12.18 10.71 14.57 13.08 15.59C13.65 15.83 14.08 15.98 14.43 16.09C15 16.27 15.53 16.25 15.95 16.19C16.42 16.12 17.39 15.6 17.59 15.03C17.8 14.46 17.8 13.98 17.73 13.88C17.67 13.78 17.51 13.72 17.27 13.6C17.03 13.48 15.85 12.9 15.63 12.82C15.41 12.74 15.25 12.7 15.09 12.94C14.93 13.18 14.47 13.72 14.33 13.88C14.19 14.04 14.05 14.06 13.81 13.94C13.57 13.82 12.56 13.49 11.36 12.42C10.43 11.59 9.8 10.56 9.68 10.36C9.56 10.16 9.67 10.05 9.79 9.93C9.9 9.82 10.03 9.65 10.15 9.51C10.27 9.37 10.31 9.27 10.39 9.11C10.47 8.95 10.43 8.81 10.37 8.69C10.31 8.57 9.85 7.43 9.65 6.96C9.46 6.5 9.27 6.57 9.12 6.56C8.98 6.55 8.82 6.55 8.66 6.55" />
  </svg>
);

const WhatsAppButton = ({
  href,
  onClick,
  label = 'Chat on WhatsApp',
  recipientName = 'User',
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'primary', // 'primary' | 'outline' | 'compact'
  disabled = false,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.warning('Please log in to your Share-It account to connect on WhatsApp.');
      navigate('/login');
      return;
    }

    if (!href) {
      e.preventDefault();
      toast.info(`WhatsApp contact is not available for ${recipientName}.`);
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs font-semibold gap-2',
    lg: 'px-5 py-3 text-sm font-bold gap-2.5',
    compact: 'p-2 text-xs gap-1',
  };

  const variantClasses = {
    primary:
      'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
    outline:
      'border border-[#25D366] text-[#25D366] dark:text-[#25D366] bg-[#25D366]/5 dark:bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white',
    compact:
      'bg-[#25D366]/10 dark:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366] hover:text-white',
  };

  return (
    <a
      href={isAuthenticated && href ? href : '#'}
      onClick={handleClick}
      target={isAuthenticated && href ? '_blank' : '_self'}
      rel="noopener noreferrer"
      title={`Open WhatsApp chat with ${recipientName}`}
      className={`inline-flex items-center justify-center rounded-xl transition duration-150 select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.primary} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      <WhatsAppIcon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {label && <span>{label}</span>}
    </a>
  );
};

export default WhatsAppButton;
