import { App, inject, reactive } from 'vue'

export type State = any

export type Commit = (mutationName: string, payload: any) => void

export type Action = {
  [i: string]: ({ commit, state }: { commit: Commit, state: State }, payload: any) => void
}

export type Mutation = {
  [i: string]: (state: State, payload: any) => void
}

export interface StoreType {
  state?: State,
  action?: Action,
  mutation?: Mutation
}

class Store implements StoreType {
  public state?: State
  public action?: Action
  public mutation?: Mutation
  constructor({ state, action, mutation }: StoreType) {
    this.state = reactive(state)
    this.action = action
    this.mutation = mutation
  }

  install(app: App) {
    app.provide('store', this)
  }

  commit(mutationName: string, payload: any) {
    this.mutation![mutationName](this.state, payload)
  }

  async dispatch(actionName: string, payload: any) {
    await this.action![actionName]({ commit: this.commit.bind(this), state: this.state }, payload)
  }
}

export function useStore() {
  return inject<StoreType>('store')
}

export function createStore({ state, action, mutation }: StoreType) {
  return new Store({ state, action, mutation })
}
