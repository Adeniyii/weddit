import React, { FC } from 'react'
import NavBar from './NavBar'
import Wrapper from './Wrapper'

interface Props {
	children: React.ReactNode
}

const Layout: FC<Props> = ({children}) => {
	return (
    <>
      <NavBar />
      <Wrapper>{children}</Wrapper>
    </>
  );
}

export default Layout
