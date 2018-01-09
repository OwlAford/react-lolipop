import React from 'react'
import { withRouter } from 'react-router'
import { Switch, Route, NavLink, Redirect } from 'react-router-dom'
import { observable, action } from 'mobx'
import { observer, inject } from 'mobx-react'
import classNames from 'classnames'
import Loading from '^/Loading'
import List from './List'
import Footer from './Footer'
import { waiter } from '~/libs/tools'
import initTween from '~/libs/tween'
import './scss/content.scss'
import avatar from './images/avatar.jpg'
import info from './info.json'
// import cover from './images/cover.jpg'
import { getBumper } from '^/Bumper'
import Profile from 'bundle-loader?lazy&name=profile!../Profile'
import Note from 'bundle-loader?lazy&name=note!../Note'

@withRouter

@inject(stores => {
  return {
    bannerDarkHandle: state => stores.home.bannerDarkHandle(state)
  }
})

@observer
class Content extends React.Component {
  @observable scrollable = true // 测试
  @observable cricleState = 'hide'
  @observable avatarState = 'hide'
  @observable musicReady = false
  @observable bannerDarkState = false
  @observable isPlaying = false
  @observable loadingProgress = 0
  @observable currentIndex = 0
  @observable readMode = false
  @observable currentMusic = {
    name: '',
    file: '',
    cover: ''
  }

  authorName = info.author
  mottoWord = info.motto
  musicPlayList = info.playlist
  menuList = info.submenu

  constructor (props) {
    super(props)
    this.initMusicPlayer = this.initMusicPlayer.bind(this)
    this.changeReadMode = this.changeReadMode.bind(this)
    this.musicHandle = this.musicHandle.bind(this)
  }

  componentWillMount () {
    const doc = document.documentElement
    this.clientH = doc.clientHeight
    this.clientW = doc.clientWidth
  }

  @action
  changeReadMode (state) {
    this.readMode = state
    this.isPlaying = false
    this.wavesurfer.pause()
  }

  @action
  setLoadingProgress (val) {
    this.loadingProgress = Number(val)
  }

  @action
  musicHandle () {
    if (this.isPlaying) {
      this.isPlaying = false
      this.wavesurfer.pause()
    } else {
      this.isPlaying = true
      this.wavesurfer.play()
    }
  }

  setPosition (val) {
    const el = this.$scroller
    el.style.transform = el.style.webkitTransform = `translateY(${val}px)`
  }

  setVolChildsFocus (vol) {
    vol = vol - vol % 5 + (vol % 5 > 2 ? 5 : 0)
    Array.prototype.forEach.call(this.volChilds, (e, i) => {
      const curNum = e.innerText * 1
      const dis = Math.abs(curNum - vol)
      if (dis < 20) {
        let opc = 1 - dis / 20
        if (opc !== 1) {
          opc /= 2
        }
        e.style.opacity = opc
      } else {
        e.style.opacity = 0
      }
    })
  }

  volume2Position (vol) {
    return 108 - (vol / 5 * 24)
  }

  position2Volume (pos) {
    return (108 - pos) / 24 * 5
  }

  initVolumeScroller (vol) {
    this.currentVol = vol
    this.wavesurfer.backend.setVolume(~~vol / 100)
    const currY = this.currY = this.volume2Position(vol)
    this.volChilds = this.$scroller.childNodes
    this.setPosition(currY)
    this.setVolChildsFocus(vol)
    this.$banner.addEventListener('mouseup', e => {
      this.mouseupHandle()
    })
  }

  mousedownHandle (e) {
    this.moveFlag = true
    this.startY = e.pageY
  }

  mousemoveHandle (e) {
    if (this.moveFlag) {
      this.moveY = e.pageY - this.startY
      let newY = this.currY + this.moveY
      let newVol = ~~this.position2Volume(newY)
      if (newVol > 100) {
        newVol = 100
        newY = this.volume2Position(100)
      } else if (newVol < 0) {
        newVol = 0
        newY = this.volume2Position(0)
      }
      this.setPosition(newY)
      this.setVolChildsFocus(newVol)
      this.currentVol = newVol
      this.wavesurfer.backend.setVolume(newVol / 100)
    }
  }

  mouseupHandle () {
    if (this.moveFlag) {
      this.moveFlag = false
      this.currY += this.moveY
    }
  }

  initMusicPlayer (index, auto) {
    this.setLoadingProgress(0)
    this.musicReady = false
    this.isPlaying = false

    const list = this.musicPlayList
    if (index === undefined) {
      index = Math.round(Math.random() * (list.length - 1))
    }
    this.currentIndex = index
    this.currentMusic = list[index]

    const wavesurfer = this.wavesurfer

    wavesurfer.empty()
    wavesurfer.load(this.currentMusic.file)

    wavesurfer.on('loading', e => {
      this.setLoadingProgress(e)
    })

    wavesurfer.on('ready', () => {
      this.musicReady = true
      this.initVolumeScroller(75)
    })

    wavesurfer.on('finish', () => {
      this.isPlaying = false
    })

    auto && this.musicHandle()
  }

  @action
  async componentDidMount () {
    this.wavesurfer = WaveSurfer.create({
      container: '#music',
      waveColor: 'rgba(255, 255, 255, 0.2)',
      progressColor: 'rgba(255, 255, 255, 0.8)',
      height: 64,
      backend: 'MediaElement'
    })

    this.initMusicPlayer(0)

    this.$menu.style.width = `${this.clientW}px`

    await waiter(1500)
    this.cricleState = 'run'
    await waiter(1000)
    this.cricleState = 'hide'
    this.avatarState = 'run'
    this.bannerDarkState = true
    this.props.bannerDarkHandle(true)
    await waiter(1000)
    this.avatarState = 'up'
    await waiter(300)
    initTween(this.$tween, this.clientW, this.clientH)
    await waiter(2600)
    this.scrollable = true
  }

  componentWillUnmount () {
    this.isPlaying = false
    this.wavesurfer.destroy()
  }

  render () {
    const middStyle = {
      top: `${this.clientH * 0.4}px`,
      left: `${this.clientW * 0.5}px`
    }
    const musicBox = {
      play: this.isPlaying,
      switchMusic: this.initMusicPlayer,
      index: this.currentIndex,
      list: this.musicPlayList,
      changeMode: this.changeReadMode,
      readMode: this.readMode,
      musicHandle: this.musicHandle
    }

    const Menu = ({ defaultClass }) => this.menuList.map(
      (item, i) => (
        <NavLink
          key={i}
          className={defaultClass}
          exact
          to={item.path}
          activeClassName='active'
        >
          {item.label}
        </NavLink>
      )
    )

    const couldPlay = this.avatarState === 'up' && this.musicReady
    const waitPlay = this.avatarState === 'up' && !this.musicReady

    return (
      <div className='home-content'>
        <canvas className='tween' ref={node => { this.$tween = node }} />
        <div
          className='content-banner'
          ref={node => { this.$banner = node }}
          style={{
            height: this.readMode ? '0' : `${this.clientH}px`
          }}
        >
          <div className='banner-inner' style={{ height: `${this.clientH}px` }}>
            <div
              key='app-logo'
              className={classNames({
                'app-logo': true,
                'running': this.bannerDarkState
              })}
            />
            <div key='app-brand' className='app-brand halofont'>Halo</div>
            <div
              className={classNames({
                'circleLoop': true,
                'hide': this.cricleState === 'hide',
                'running': this.cricleState === 'run'
              })}
              style={middStyle}
            />
            <div
              style={middStyle}
              className={classNames({
                'avatar': true,
                'hide': this.avatarState === 'hide',
                'upper': this.avatarState === 'up',
                'running': this.avatarState === 'run'
              })}
            >
              <div className='wrap'>
                <div
                  className={classNames({
                    'halo': true,
                    'show': this.avatarState === 'up',
                    'playing': this.isPlaying
                  })}
                />
                <div className={classNames({
                  'imgr': true,
                  'fire': this.avatarState === 'run'
                })}>
                  <img src={avatar} alt='avatar' width='120' height='120' />
                </div>
                <div className={classNames({
                  'album': true,
                  'playing': this.isPlaying
                })}>
                  <img src={this.currentMusic.cover} alt='album cover' width='120' height='120' />
                </div>
              </div>
              <div
                className={classNames({
                  'textNode': true,
                  'show': this.avatarState === 'up'
                })}
              >
                <div className='userName halofont'>
                  {
                    this.isPlaying
                      ? this.currentMusic.name
                      : this.authorName
                  }
                </div>
                {
                  !this.isPlaying && <div className='motto'>{this.mottoWord}</div>
                }
              </div>
            </div>
            <div
              className={classNames({
                'menu': true,
                'show': this.avatarState === 'up'
              })}
              ref={node => { this.$menu = node }}
            >
              <Menu defaultClass='item halofont' />
            </div>
            <i
              className={classNames({
                'iconfont': true,
                'arrowDown': true,
                'show': this.scrollable
              })}
            >&#xe608;</i>
            <div
              id='music'
              className={classNames({
                'show': couldPlay
              })}
            >
              <div
                className={classNames({
                  'musicControl': true,
                  'pause': this.isPlaying,
                  'right': this.clientH < 620
                })}
                onClick={e => this.musicHandle()}
              />
              <div className='cover'>
                <img src={this.currentMusic.cover} width='100%' alt='viva la vida' />
                <div className='progress' style={{ height: `${100 - this.loadingProgress}%` }} />
              </div>
            </div>
            {
              waitPlay && <div className='musicPlaceholder'><Loading /></div>
            }
            <div
              className={classNames({
                'calibration': true,
                'upper': this.clientH < 620,
                'show': couldPlay
              })}
              onMouseDown={e => this.mousedownHandle(e)}
              onMouseMove={e => this.mousemoveHandle(e)}
            >
              {
                (new Array(21)).fill(0).map((e, i) => {
                  return i === 10 ? <i key={i} className='long' /> : <i key={i} />
                })
              }
            </div>
            <div
              className={classNames({
                'volume': true,
                'upper': this.clientH < 620,
                'show': couldPlay
              })}
              onMouseDown={e => this.mousedownHandle(e)}
              onMouseMove={e => this.mousemoveHandle(e)}
            >
              <div className='scroller' ref={node => { this.$scroller = node }}>
                {
                  (new Array(101)).fill(0).map((e, num) => {
                    if (num !== 0 && num % 5) {
                      return null
                    }
                    num > 9 ? num = String(num) : num = '0' + num
                    return <div className='num' key={num}>{num}</div>
                  })
                }
              </div>
            </div>
          </div>
        </div>
        <div
          className={classNames({
            'content-wrap': true,
            'scrollable': this.scrollable
          })}
          style={{
            minHeight: `${this.clientH}px`
          }}
        >
          <List {...musicBox} />
          {
            this.readMode && (
              <div className='readModeMenu'>
                <div className='inner'>
                  <div className='midd'>
                    <div className='app-logo' />
                    <Menu defaultClass='item' />
                    <div
                      className='quitBtn'
                      onClick={e => { this.changeReadMode(false) }}
                    >
                      退出阅读模式
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          <div className='content-main'>
            <Switch>
              <Route
                path='/home/profile'
                component={getBumper(Profile)}
              />
              <Route
                path='/home/note'
                component={getBumper(Note)}
              />
              <Route component={() => <Redirect to='/home/profile' />} />
            </Switch>
          </div>
          <Footer />
        </div>
      </div>
    )
  }
}

export default Content
