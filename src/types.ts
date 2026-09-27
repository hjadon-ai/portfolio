export type SectionId = 'impact' | 'experience' | 'work' | 'leadership' | 'ai' | 'skills' | 'credentials'

export interface Achievement {
  id: string
  title: string
  detail: string
  metric?: string
  icon: 'trend' | 'layers' | 'people' | 'spark'
}

export interface Experience {
  id: string
  role: string
  company: string
  client?: string
  location?: string
  period: string
  summary: string
  bullets: string[]
  skills: string[]
}

export interface CaseStudy {
  id: string
  title: string
  organization: string
  category: string
  period: string
  description: string
  challenge: string
  approach: string[]
  outcome: string
  technologies: string[]
  accent: 'blue' | 'green' | 'orange'
}

export interface LeadershipItem {
  id: string
  title: string
  detail: string
  stat?: string
}

export interface SkillGroup {
  id: string
  title: string
  items: string[]
}

export interface Credential {
  id: string
  title: string
  institution: string
  year?: string
}

export interface Profile {
  name: string
  location: string
  email: string
  phone: string
  linkedin: string
  website: string
  availability: string
}

export interface PortfolioContent {
  profile: Profile
  achievements: Achievement[]
  experiences: Experience[]
  caseStudies: CaseStudy[]
  leadership: LeadershipItem[]
  ai: { intro: string; practices: string[] }
  skillGroups: SkillGroup[]
  credentials: Credential[]
}

export interface Version {
  id: string
  label: string
  eyebrow: string
  headline: string
  summary: string
  focus: string[]
  sectionOrder: SectionId[]
  visibleSections: SectionId[]
  achievementIds: string[]
  experienceIds: string[]
  caseStudyIds: string[]
  leadershipIds: string[]
  skillGroupIds: string[]
  featuredCaseStudyId: string
}

export interface PortfolioData {
  schemaVersion: 1
  content: PortfolioContent
  versions: Version[]
}
