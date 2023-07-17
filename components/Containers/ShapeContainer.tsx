import React, { PropsWithChildren } from 'react'
import { ShapeIcon } from '@/components/Icons/Icons'

type Props = {
  width?: string,
  height?: string,
  className?: string,
  containerClassName?: string
}

const ShapeContainer: React.FC<PropsWithChildren<Props>> = ({
  width = "w-[300px]",
  height = "h-[300px]",
  children,
  className,
  containerClassName
}
) => {
  return (
    <div className={`relative ${width} ${height} ${className}`}>
      <ShapeIcon />
      <div className={`absolute top-[28%] left-[28%] right-[20%] h-[55%] ${containerClassName}`}>
        {children}
      </div>
    </div>
  )
}

export default ShapeContainer