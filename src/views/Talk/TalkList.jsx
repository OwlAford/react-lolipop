import React from 'react'
import { observer, inject } from 'mobx-react'
import classNames from 'classnames'
import { formatDate } from '~/filters'
import { withToast } from '^/Toast'

@withToast

@inject(stores => {
  const {
    chat: {
      prevDate,
      curChatList
    }
  } = stores
  return {
    curChatList,
    prevDate,
    triggerPrevHandle: () => stores.chat.triggerPrevHandle()
  }
})

@observer
export default class TalkList extends React.Component {
  couldAutoScroll = true

  componentDidMount () {
    const params = {
      disableTouch: true,
      scrollbars: true,
      mouseWheel: true,
      fadeScrollbars: true
    }
    this.talkScroll = new IScroll(this.refs.$talkList, params)
    setTimeout(() => {
      this.talkScroll.refresh()
      this.talkScroll.scrollTo(0, this.talkScroll.maxScrollY, 300)
    }, 300)
    this.talkScroll.on('scrollEnd', () => {
      if (this.talkScroll.y === this.talkScroll.maxScrollY) {
        this.couldAutoScroll = true
      }
    })
  }

  componentDidUpdate () {
    if (this.talkScroll) {
      this.talkScroll.refresh()

      this.couldAutoScroll &&
      this.talkScroll.scrollTo(0, this.talkScroll.maxScrollY, 300)
    }
  }

  componentWillUnmount () {
    this.talkScroll.destroy()
  }

  triggerPrev () {
    this.props.triggerPrevHandle()
    this.couldAutoScroll = false
  }

  formatIdDate (id) {
    return formatDate(id.replace('id_', '') * 24 * 60 * 60 * 1000).ChineseFullDate
  }

  render () {
    const {
      curChatList,
      prevDate
    } = this.props

    return (
      <div className='talking-cxt' ref='$talkList'>
        <div className='chat-list'>
          {
            prevDate &&
            <div className='before-view'>
              <span>
                {this.formatIdDate(prevDate)}
                <span
                  className='jump'
                  onClick={e => { this.triggerPrev() }}
                >点击查看</span>
              </span>
            </div>
          }
          {
            curChatList.map((item, i) => {
              return (
                <div className='date-group' key={i}>
                  {
                    item.map((sub, j) => {
                      return (
                        <div
                          key={j}
                          className={classNames('chat-list-item', {
                            'dir-right': window.returnCitySN.cip === sub.ip
                          })}
                        >
                          <i
                            alt={sub.avatar}
                            className={'round-avatar ' + sub.avatar}
                          >
                            <div className='send-time'>{formatDate(sub.time).clock}</div>
                          </i>
                          <div className='nicname'>{sub.author}</div>
                          <div
                            className='message-detail'
                            dangerouslySetInnerHTML={{ __html: sub.text }}
                          />
                        </div>
                      )
                    })
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }
}
