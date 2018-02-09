import { observable, action } from 'mobx'

export default class ListModel {
  @observable favList = []

  @action
  getFavList (cb, err) {
    axios.get('http://yuis.qiniudn.com/music/wallpaper-favorite.json')
      .then(({ data }) => {
        this.favList = data.src || []
        cb && cb(data)
      })
      .catch(er => {
        err && err(er)
      })
  }
}
