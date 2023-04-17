import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { IoHandRightSharp } from 'react-icons/io5';

const Lobby = () => {

    const [link, setLink] = useState('');

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate(`/channel/${link}`)  
    }

  return (
      <div className='bg-[#1a1a1a] w-full h-screen text-white flex justify-center items-center'>
          <div className='text-white top-7 left-10 fixed text-3xl italic font-semibold'>TalentPlus</div>
          <form onSubmit={handleSubmit} className='flex flex-col items-center bg-[#262625] h-auto w-1/2 rounded-md'>
              <div className='h-24 items-center bg-[#363739] w-full flex justify-center font-medium text-2xl mb-6 gap-2 rounded-md'><IoHandRightSharp color='#F6BA6F' /> Create OR Join a Room</div>
              <div className='w-full flex justify-center flex-col items-center p-6 font-medium rounded-md'> 
                  <div className='w-full'>
                  <input onChange={e => setLink(e.target.value)} value={link} type="text" name='invite_link' className='w-full h-14 bg-[#363739]  outline-none my-4 px-4 rounded-md' required />
              </div>
              <input className='bg-[#845695] w-full p-4 rounded-md' type='submit' value="Join Room" />
              </div>
          </form>
    </div>
  )
}

export default Lobby;