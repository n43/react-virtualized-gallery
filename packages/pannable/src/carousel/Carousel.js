import React from 'react';
import Player from './Player';

export default class Carousel extends React.Component {
  static defaultProps = {
    renderIndicator: () => null,
    onSlideChange: () => {},
  };

  componentDidMount() {}

  componentDidUpdate(prevProps, prevState) {}

  // getActiveIndex() {
  //   const { loop } = this.props;
  //   const player = this.playerRef;
  //   const activeIndex = player.getActiveIndex();
  //   const pageCount = player.getPageCount();

  //   if (loop) {
  //     return this._calculateActiveSlideForLoop({ activeIndex, pageCount });
  //   }

  //   return activeIndex;
  // }

  // getVisibleRect() {
  //   const { loop, direction } = this.props;
  //   const player = this.playerRef;
  //   const pad = player.padRef;
  //   const activeIndex = player.getActiveIndex();
  //   const pageCount = player.getPageCount();
  //   const contentSize = pad.getContentSize();
  //   const visibleRect = pad.getVisibleRect();

  //   if (!loop || pageCount === 0 || activeIndex < pageCount / 2) {
  //     return visibleRect;
  //   }

  //   let visibleRectForLoop = { ...visibleRect };
  //   const [width, x] = direction === 'x' ? ['width', 'x'] : ['height', 'y'];
  //   visibleRectForLoop[x] = visibleRectForLoop[x] - contentSize[width] / 2;

  //   return visibleRectForLoop;
  // }

  slideTo({ index, animated = true }) {
    const player = this.playerRef;
    const activeIndex = player.getActiveIndex();
    const pageCount = player.getPageCount();

    if (index > pageCount / 2 - 1) {
      return;
    }

    if (activeIndex >= pageCount / 2) {
      index = pageCount / 2 + index;
    }

    player.setFrame({ index, animated });
  }

  slidePrev() {
    const player = this.playerRef;

    player.rewind();
  }

  slideNext() {
    const player = this.playerRef;

    player.forward();
  }

  _onSlideChange = () => {
    const { loop, onSlideChange } = this.props;

    if (loop) {
      // activeSlide = this._calculateActiveSlideForLoop({
      //   activeIndex,
      //   pageCount,
      // });
      this._alternateFramesForLoop();
    }

    // onSlideChange({ activeIndex: activeSlide, pageCount });
  };

  _calculateActiveSlideForLoop({ activeIndex, pageCount }) {
    if (activeIndex < pageCount / 2) {
      return activeIndex;
    }

    return activeIndex - pageCount / 2;
  }

  render() {
    const {
      loop,
      children,
      onSlideChange,
      renderIndicator,
      ...playerProps
    } = this.props;

    let element = children;
    if (typeof element === 'function') {
      element = element(this);
    }

    return (
      <Player {...playerProps} onScroll={this._onSlideChange}>
        {player => {
          this.playerRef = player;

          const wrapperStyle = {
            position: 'relative',
          };

          return (
            <div style={wrapperStyle}>
              {element}
              {renderIndicator()}
            </div>
          );
        }}
      </Player>
    );
  }
}
