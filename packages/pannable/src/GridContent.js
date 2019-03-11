import React from 'react';

export default class GridContent extends React.PureComponent {
  static defaultProps = {
    direction: 'vertical',
    itemCount: 0,
    lineSpacing: 0,
    inneritemSpacing: 0,
    width: -1,
    height: -1,
    itemWidth: 0,
    itemHeight: 0,
    itemKey: attrs => attrs.index,
    renderItem: () => null,
    visibleRect: { x: 0, y: 0, width: 0, height: 0 },
    onResize: () => {},
  };

  state = {
    count: { row: 0, column: 0 },
    size: { width: 0, height: 0 },
    layoutAttrs: [],
  };

  getSize() {
    return this.state.size;
  }

  getCount() {
    return this.state.count;
  }

  componentDidMount() {
    this._calculateLayout();
  }

  componentDidUpdate(prevProps) {
    const {
      width,
      height,
      itemWidth,
      itemHeight,
      lineSpacing,
      inneritemSpacing,
      itemCount,
      direction,
    } = this.props;

    if (
      prevProps.width !== width ||
      prevProps.height !== height ||
      prevProps.itemWidth !== itemWidth ||
      prevProps.itemHeight !== itemHeight ||
      prevProps.lineSpacing !== lineSpacing ||
      prevProps.inneritemSpacing !== inneritemSpacing ||
      prevProps.itemCount !== itemCount ||
      prevProps.direction !== direction
    ) {
      this._calculateLayout();
    }
  }

  _calculateLayout() {
    this.setState((state, props) => {
      const {
        width,
        height,
        itemWidth,
        itemHeight,
        lineSpacing,
        inneritemSpacing,
        itemCount,
        direction,
        onResize,
      } = props;

      const nextState = calculateLayout(
        { width, height },
        { width: itemWidth, height: itemHeight },
        lineSpacing,
        inneritemSpacing,
        itemCount,
        direction
      );

      if (
        state.size.width !== nextState.size.width ||
        state.size.height !== nextState.size.height
      ) {
        onResize(nextState.size);
      }

      return nextState;
    });
  }

  getItemRect({ itemIndex, rowIndex, columnIndex }) {
    const { direction } = this.props;
    const { count, layoutAttrs } = this.state;

    if (rowIndex !== undefined && columnIndex !== undefined) {
      itemIndex = calculateItemIndex(
        { row: rowIndex, column: columnIndex },
        count,
        direction
      );
    }

    if (itemIndex !== undefined && itemIndex < layoutAttrs.length) {
      const attrs = layoutAttrs[itemIndex];

      return {
        x: attrs.x,
        y: attrs.y,
        width: attrs.width,
        height: attrs.height,
      };
    }

    return null;
  }

  render() {
    const { visibleRect, renderItem, itemKey, children } = this.props;
    const { layoutAttrs } = this.state;

    if (typeof children === 'function') {
      return children(this);
    }

    const grids = [];

    for (let index = 0; index < layoutAttrs.length; index++) {
      const attrs = layoutAttrs[index];

      if (needsRender(attrs, visibleRect)) {
        const cellStyle = {
          position: 'absolute',
          left: attrs.x,
          top: attrs.y,
          width: attrs.width,
          height: attrs.width,
        };

        grids.push(
          <div key={itemKey(attrs)} style={cellStyle}>
            {renderItem(attrs)}
          </div>
        );
      }
    }

    return <React.Fragment>{grids}</React.Fragment>;
  }
}

function needsRender(cellRect, visibleRect, name) {
  if (name) {
    const dx = cellRect.x - visibleRect.x;

    return (
      -0.25 * visibleRect.width < dx + cellRect.width &&
      dx < 1.25 * visibleRect.width
    );
  }

  return (
    needsRender(
      { x: cellRect.x, width: cellRect.width },
      { x: visibleRect.x, width: visibleRect.width },
      'x'
    ) &&
    needsRender(
      { x: cellRect.y, width: cellRect.height },
      { x: visibleRect.y, width: visibleRect.height },
      'y'
    )
  );
}

function calculateItemIndex(index, count, direction) {
  if (!direction) {
    return index.column + index.row * count.column;
  }

  if (direction === 'vertical') {
    return calculateItemIndex(
      {
        row: index.row,
        column: index.column,
      },
      {
        row: count.row,
        column: count.column,
      }
    );
  } else if (direction === 'horizontal') {
    return calculateItemIndex(
      {
        row: index.column,
        column: index.row,
      },
      {
        row: count.column,
        column: count.row,
      }
    );
  }
}

function calculateLayout(
  size,
  itemSize,
  lineSpacing,
  inneritemSpacing,
  itemCount,
  direction
) {
  if (!direction) {
    let sizeWidth = size.width;
    let sizeHeight = 0;
    let columnCount = 0;
    let rowCount = 0;
    const layoutAttrs = [];

    if (sizeWidth < 0) {
      sizeWidth =
        itemCount * itemSize.width +
        (itemCount <= 1 ? 0 : (itemCount - 1) * inneritemSpacing);
      columnCount = itemCount;
    } else {
      if (itemSize.width === 0 && lineSpacing === 0) {
        columnCount = itemCount;
      } else {
        columnCount =
          1 +
          (sizeWidth < itemSize.width
            ? 0
            : Math.floor(
                (sizeWidth - itemSize.width) /
                  (itemSize.width + inneritemSpacing)
              ));
      }
    }

    if (columnCount > 0) {
      rowCount = Math.ceil(itemCount / columnCount);
    }

    if (rowCount > 0) {
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        if (rowIndex > 0) {
          sizeHeight += lineSpacing + itemSize.height;
        }

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
          const index = columnIndex + rowIndex * columnCount;

          if (index < itemCount) {
            layoutAttrs.push({
              x: Math.round(
                columnIndex * ((sizeWidth - itemSize.width) / (columnCount - 1))
              ),
              y: sizeHeight,
              width: itemSize.width,
              height: itemSize.height,
              index,
              rowIndex,
              columnIndex,
            });
          }
        }
      }

      sizeHeight += itemSize.height;
    }

    return {
      count: { row: rowCount, column: columnCount },
      size: { width: sizeWidth, height: sizeHeight },
      layoutAttrs,
    };
  }

  if (direction === 'vertical') {
    return calculateLayout(
      { width: size.width, height: size.height },
      { width: itemSize.width, height: itemSize.height },
      lineSpacing,
      inneritemSpacing,
      itemCount
    );
  } else if (direction === 'horizontal') {
    const layout = calculateLayout(
      { width: size.height, height: size.width },
      { width: itemSize.height, height: itemSize.width },
      lineSpacing,
      inneritemSpacing,
      itemCount
    );

    return {
      size: {
        width: layout.size.height,
        height: layout.size.width,
      },
      count: {
        row: layout.count.column,
        column: layout.count.row,
      },
      layoutAttrs: layout.layoutAttrs.map(attrs => ({
        x: attrs.y,
        y: attrs.x,
        width: attrs.height,
        height: attrs.width,
      })),
    };
  }
}
