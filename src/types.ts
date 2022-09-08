export interface GitInfo {
  provider: 'github' | 'gitlab' | 'bitbucket'
  repo: string
  subdir: string
  ref: string
}
