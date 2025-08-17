import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLanguageAbbreviation(language: string): string {
  const abbreviations: Record<string, string> = {
    'typescript': 'TS',
    'javascript': 'JS',
    'python': 'PY',
    'java': 'JAVA',
    'ruby': 'RB',
    'php': 'PHP',
    'csharp': 'C#',
    'cplusplus': 'C++',
    'css': 'CSS',
    'html': 'HTML',
    'rust': 'RS',
    'go': 'GO',
    'swift': 'SWIFT',
    'kotlin': 'KT',
    'scala': 'SCALA',
    'dart': 'DART',
    'shell': 'SH',
    'powershell': 'PS',
    'dockerfile': 'DCKR',
    'markdown': 'MD',
    'yaml': 'YML',
    'json': 'JSON',
    'sql': 'SQL',
    'vue': 'VUE',
    'react': 'REACT',
    'angular': 'NG'
  }

  const normalizedLang = language.toLowerCase().replace(/[^a-z]/g, '')
  return abbreviations[normalizedLang] || language.slice(0, 3).toUpperCase()
}
