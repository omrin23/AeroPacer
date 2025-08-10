import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ 
  children, 
  className, 
  padding = 'md', 
  shadow = 'md',
  hover = false 
}) => {
  const baseClasses = 'bg-surface rounded-xl border border-border';
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const shadows = {
    none: '',
    sm: 'shadow-card',
    md: 'shadow-card',
    lg: 'shadow-glow',
  };
  
  const hoverClasses = hover ? 'hover:-translate-y-0.5 hover:shadow-glow transition-all duration-300' : 'transition-shadow duration-300';

  return (
    <div className={clsx(
      baseClasses,
      paddings[padding],
      shadows[shadow],
      hoverClasses,
      className
    )}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={clsx('border-b border-border pb-4 mb-4', className)}>
      {children}
    </div>
  );
};

const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={clsx(className)}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={clsx('border-t border-border pt-4 mt-4', className)}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;