import React from 'react'

function Container({children}:{children:React.ReactNode}) {
  return (
    <main className='mx-auto min-h-screen w-full border-x  md:max-w-2xl'>
            {children}
        </main>
  )
}

export default Container
