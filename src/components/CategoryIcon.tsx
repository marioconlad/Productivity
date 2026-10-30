import React from 'react';
import {
  PiggyBank,
  BookOpen,
  Flame,
  Folder,
  DollarSign,
  GraduationCap,
  Dumbbell,
  Heart,
  Target,
  Sparkles,
  Briefcase,
  Code,
  Music,
  Smile,
  Zap,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  // If the icon is an emoji (contains emoji / pictographic characters or is short unicode)
  const isEmoji = name && (/\p{Extended_Pictographic}/u.test(name) || (name.length <= 4 && !/^[a-zA-Z]+$/.test(name)));
  if (isEmoji) {
    return (
      <span
        className={`inline-flex items-center justify-center select-none leading-none ${className}`}
        style={{ fontSize: `${size}px` }}
        role="img"
        aria-label="Category Emoji"
      >
        {name}
      </span>
    );
  }

  const iconProps = { className, size };

  switch (name) {
    case 'PiggyBank':
    case 'money_saving':
      return <PiggyBank {...iconProps} />;
    case 'DollarSign':
      return <DollarSign {...iconProps} />;
    case 'BookOpen':
    case 'studying':
      return <BookOpen {...iconProps} />;
    case 'GraduationCap':
      return <GraduationCap {...iconProps} />;
    case 'Flame':
    case 'fitness':
      return <Flame {...iconProps} />;
    case 'Dumbbell':
      return <Dumbbell {...iconProps} />;
    case 'Heart':
      return <Heart {...iconProps} />;
    case 'Target':
      return <Target {...iconProps} />;
    case 'Sparkles':
      return <Sparkles {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'Code':
      return <Code {...iconProps} />;
    case 'Music':
      return <Music {...iconProps} />;
    case 'Smile':
      return <Smile {...iconProps} />;
    case 'Zap':
      return <Zap {...iconProps} />;
    default:
      return <Folder {...iconProps} />;
  }
};
