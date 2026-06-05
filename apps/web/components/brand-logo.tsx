import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';

type BrandLogoVariant = 'horizontal-positive' | 'horizontal-negative' | 'vertical-positive' | 'vertical-negative';

const LOGOS: Record<BrandLogoVariant, { src: string; width: number; height: number }> = {
  'horizontal-positive': {
    src: '/brand/mkt-logo-horizontal-positive.png',
    width: 912,
    height: 202,
  },
  'horizontal-negative': {
    src: '/brand/mkt-logo-horizontal-negative.png',
    width: 912,
    height: 202,
  },
  'vertical-positive': {
    src: '/brand/mkt-logo-vertical-positive.png',
    width: 845,
    height: 764,
  },
  'vertical-negative': {
    src: '/brand/mkt-logo-vertical-negative.png',
    width: 845,
    height: 764,
  },
};

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = 'horizontal-positive',
  className,
  priority = false,
}: BrandLogoProps): JSX.Element {
  const logo = LOGOS[variant];
  return (
    <Image
      src={withBasePath(logo.src)}
      alt="Phan mem MKT"
      width={logo.width}
      height={logo.height}
      priority={priority}
      className={className}
    />
  );
}
