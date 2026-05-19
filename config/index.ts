import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const API_KEY = `${process.env.APP_API_KEY}`
export const API_URL = `${process.env.APP_API_URL}`
export const IS_WORKFLOW = `${process.env.NEXT_PUBLIC_APP_TYPE_WORKFLOW}` === 'true'
export const APP_INFO: AppInfo = {
    title: '智理校园',
    description: '面向AIGC时代的高校学术合规与科研安全审计平台',
    copyright: '',
    privacy_policy: '',
    default_language: 'zh-Hans',
}

export const API_PREFIX = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}`

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
