import { Category, ItemType, Priority } from '../types';

export interface ExtractedToken {
  type: 'date' | 'time' | 'category' | 'priority' | 'itemType';
  text: string;
  value: string;
}

export interface ParsedTaskInput {
  cleanTitle: string;
  rawTitle: string;
  dueDate?: string; // YYYY-MM-DD
  dueDateLabel?: string;
  dueTime?: string; // HH:mm
  dueTimeLabel?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  itemType?: ItemType;
  priority?: Priority;
  tokens: ExtractedToken[];
}

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const formatYMD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function parseNaturalLanguageTask(
  rawInput: string,
  categories: Category[],
  baseDate: Date = new Date()
): ParsedTaskInput {
  if (!rawInput.trim()) {
    return {
      cleanTitle: '',
      rawTitle: '',
      tokens: [],
    };
  }

  let text = rawInput;
  const tokens: ExtractedToken[] = [];

  let dueDate: string | undefined;
  let dueDateLabel: string | undefined;
  let dueTime: string | undefined;
  let dueTimeLabel: string | undefined;
  let categoryId: string | undefined;
  let categoryName: string | undefined;
  let categoryColor: string | undefined;
  let itemType: ItemType | undefined;
  let priority: Priority | undefined;

  // 1. Parse Category Tags (#math, #study, #money, #fitness, #gym, etc.)
  const categoryTagRegex = /#([a-zA-Z0-9_\-]+)/gi;
  let catMatch: RegExpExecArray | null;
  const matchedCatTokens: string[] = [];

  while ((catMatch = categoryTagRegex.exec(text)) !== null) {
    const rawTag = catMatch[0];
    const tagName = catMatch[1].toLowerCase();

    // Check if tag is itemType marker
    if (tagName === 'habit' || tagName === 'routine') {
      itemType = 'reminder';
      tokens.push({ type: 'itemType', text: rawTag, value: 'reminder' });
      matchedCatTokens.push(rawTag);
      continue;
    }
    if (tagName === 'goal' || tagName === 'milestone') {
      itemType = 'goal';
      tokens.push({ type: 'itemType', text: rawTag, value: 'goal' });
      matchedCatTokens.push(rawTag);
      continue;
    }
    if (tagName === 'reminder' || tagName === 'task') {
      itemType = 'reminder';
      tokens.push({ type: 'itemType', text: rawTag, value: 'reminder' });
      matchedCatTokens.push(rawTag);
      continue;
    }

    // Match against categories
    const foundCategory = categories.find((cat) => {
      const cName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cType = cat.type.toLowerCase().replace(/[^a-z0-9]/g, '');
      const tagClean = tagName.replace(/[^a-z0-9]/g, '');

      // Direct exact match
      if (cName.includes(tagClean) || tagClean.includes(cName)) return true;
      if (cType.includes(tagClean) || tagClean.includes(cType)) return true;

      // Common aliases for ENT, EPS, BIDA, COD, MEN, SPORT
      if (cat.name === 'ENT' && ['ent', 'entrepreneurship', 'startup', 'pitch', 'venture'].includes(tagClean)) return true;
      if (cat.name === 'EPS' && ['eps', 'strategy', 'strategic', 'roadmap', 'businessmodel'].includes(tagClean)) return true;
      if (cat.name === 'BIDA' && ['bida', 'data', 'analytics', 'bi', 'sql', 'python', 'dashboard'].includes(tagClean)) return true;
      if (cat.name === 'COD' && ['cod', 'coding', 'code', 'dev', 'algorithm', 'bug', 'github'].includes(tagClean)) return true;
      if (cat.name === 'MEN' && ['men', 'mental', 'wellbeing', 'wellness', 'mind', 'mood', 'cbt'].includes(tagClean)) return true;
      if (cat.name === 'SPORT' && ['sport', 'sports', 'gym', 'workout', 'run', 'cardio', 'training', 'fitness'].includes(tagClean)) return true;

      return false;
    });

    if (foundCategory) {
      categoryId = foundCategory.id;
      categoryName = foundCategory.name;
      categoryColor = foundCategory.color;
      tokens.push({ type: 'category', text: rawTag, value: foundCategory.name });
      matchedCatTokens.push(rawTag);
    }
  }

  // Also check if any category's emoji icon is in the input text
  categories.forEach((cat) => {
    if (cat.icon && cat.icon.length <= 4 && text.includes(cat.icon) && !categoryId) {
      categoryId = cat.id;
      categoryName = cat.name;
      categoryColor = cat.color;
      tokens.push({ type: 'category', text: cat.icon, value: cat.name });
      matchedCatTokens.push(cat.icon);
    }
  });

  // Remove matched category tags from text
  matchedCatTokens.forEach((tok) => {
    text = text.replace(tok, ' ');
  });

  // 2. Parse Priority (!high, !urgent, !medium, !low, !p1, !p2, !p3)
  const priorityRegex = /(?:^|\s)(!(?:high|urgent|medium|med|low|p1|p2|p3))(?:\s|$)/i;
  const prioMatch = text.match(priorityRegex);
  if (prioMatch) {
    const rawPrio = prioMatch[1];
    const prioVal = rawPrio.toLowerCase().replace('!', '');
    if (prioVal === 'high' || prioVal === 'urgent' || prioVal === 'p1') {
      priority = 'high';
    } else if (prioVal === 'medium' || prioVal === 'med' || prioVal === 'p2') {
      priority = 'medium';
    } else if (prioVal === 'low' || prioVal === 'p3') {
      priority = 'low';
    }
    tokens.push({ type: 'priority', text: rawPrio, value: priority || 'medium' });
    text = text.replace(prioMatch[0], ' ');
  }

  // 3. Parse Time ("at 5pm", "at 5:30 pm", "5pm", "17:00", "9:00 am", "noon", "midnight")
  const timeRegex = /(?:\b(?:at|@)\s+)?\b((?:1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b|(?:[01]?[0-9]|2[0-3]):[0-5][0-9]\b|noon\b|midnight\b)/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    const fullTimeStr = timeMatch[0];
    const timeVal = timeMatch[1].toLowerCase().trim();

    if (timeVal === 'noon') {
      dueTime = '12:00';
      dueTimeLabel = '12:00 PM';
    } else if (timeVal === 'midnight') {
      dueTime = '00:00';
      dueTimeLabel = '12:00 AM';
    } else if (timeVal.includes('am') || timeVal.includes('pm')) {
      const isPm = timeVal.includes('pm');
      const cleanTime = timeVal.replace(/am|pm/g, '').trim();
      const parts = cleanTime.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;

      dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      dueTimeLabel = timeMatch[1].toUpperCase();
    } else if (timeVal.includes(':')) {
      // 24hr format
      const [h, m] = timeVal.split(':').map((n) => parseInt(n, 10));
      dueTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const period = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 || 12;
      dueTimeLabel = `${dispH}:${String(m).padStart(2, '0')} ${period}`;
    }

    if (dueTime) {
      tokens.push({ type: 'time', text: fullTimeStr.trim(), value: dueTimeLabel || dueTime });
      text = text.replace(fullTimeStr, ' ');
    }
  }

  // 4. Parse Dates ("today", "tomorrow", "tmrw", "this friday", "next monday", "on wednesday", "in 3 days", "oct 28")
  const datePatterns = [
    // Today
    {
      regex: /\b(today|tonight)\b/i,
      calc: () => {
        const d = new Date(baseDate);
        return { date: d, label: 'Today' };
      },
    },
    // Tomorrow
    {
      regex: /\b(tomorrow|tmrw)\b/i,
      calc: () => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + 1);
        return { date: d, label: 'Tomorrow' };
      },
    },
    // In X days
    {
      regex: /\bin\s+(\d+)\s+days?\b/i,
      calc: (match: RegExpMatchArray) => {
        const count = parseInt(match[1], 10);
        const d = new Date(baseDate);
        d.setDate(d.getDate() + count);
        return { date: d, label: `In ${count} days` };
      },
    },
    // Next / This weekday (e.g. "next monday", "this friday", "on tuesday", "friday")
    {
      regex: /\b(?:(next|this|on)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i,
      calc: (match: RegExpMatchArray) => {
        const modifier = match[1]?.toLowerCase();
        const targetDay = DAYS_OF_WEEK[match[2].toLowerCase()];
        const currentDay = baseDate.getDay();

        let diff = (targetDay - currentDay + 7) % 7;
        if (diff === 0 || modifier === 'next') diff += 7;

        const d = new Date(baseDate);
        d.setDate(d.getDate() + diff);
        const dayName = d.toLocaleDateString('default', { weekday: 'short' });
        return { date: d, label: modifier === 'next' ? `Next ${dayName}` : dayName };
      },
    },
    // Specific month & day (e.g. "oct 28", "october 28th", "nov 5")
    {
      regex: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      calc: (match: RegExpMatchArray) => {
        const mStr = match[1].toLowerCase().substring(0, 3);
        const monthNum = MONTHS[mStr];
        const dayNum = parseInt(match[2], 10);
        const year = baseDate.getFullYear();
        const d = new Date(year, monthNum, dayNum);
        // If date has passed this year, assign to next year
        if (d < baseDate && d.toDateString() !== baseDate.toDateString()) {
          d.setFullYear(year + 1);
        }
        return {
          date: d,
          label: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        };
      },
    },
  ];

  for (const p of datePatterns) {
    const dMatch = text.match(p.regex);
    if (dMatch) {
      const res = p.calc(dMatch);
      dueDate = formatYMD(res.date);
      dueDateLabel = res.label;
      tokens.push({ type: 'date', text: dMatch[0].trim(), value: res.label });
      text = text.replace(dMatch[0], ' ');
      break;
    }
  }

  // Clean remaining title
  let clean = text
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '')
    .trim();

  // If clean title becomes empty (e.g., user just typed "tomorrow at 5pm"), fallback to clean raw
  if (!clean) {
    clean = rawInput.trim();
  }

  return {
    cleanTitle: clean,
    rawTitle: rawInput,
    dueDate,
    dueDateLabel,
    dueTime,
    dueTimeLabel,
    categoryId,
    categoryName,
    categoryColor,
    itemType,
    priority,
    tokens,
  };
}
