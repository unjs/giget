export interface GitInfo {
  provider: 'github' | 'gitlab' | 'bitbucket'
  repo: string
  subpath: string
  ref: string
}
