import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import HomePage from './pages/home/HomePage'
import SignUpPage from './pages/auth/SignUpPage'
import LoginPage from './pages/auth/LoginPage'
import { Routes, Route } from'react-router-dom'
import Sidebar from '../src/components/common/Sidebar'
import RightPanel from '../src/components/common/RightPanel'
import NotificationPage from './pages/notification/NotificationPage'
import ProfilePage from './pages/profile/ProfilePage'
import { Toaster } from 'react-hot-toast'
import {useQuery} from '@tanstack/react-query'
import LoadingSpinner from "./components/common/LoadingSpinner";
import { Navigate } from "react-router-dom";
function App() {
	const { data:authUser, isLoading, }=useQuery({
		//use queryKey key to give a unique name to our query and refer to it later
		queryKey: ['authUser'],
		queryFn: async() => {
			try {
				const res = await fetch('/api/auth/me');
				const data = await res.json();
				if(data.error) return null;

				if(!res.ok ) throw new Error(data.error || 'Something went wrong');
				console.log(data);
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		retry: false
	}
	)
	if(isLoading) return( <div className='h-screen flex justify-center items-center'>
		<LoadingSpinner size='lg' />
	</div>)
	return (
		<div className='flex max-w-6xl mx-auto'>

			{authUser && <Sidebar/>}
			<Routes>
				<Route path='/' element={authUser ? <HomePage /> : <Navigate  to="/login" />} />
				<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate  to="/"/>} />
				<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate  to="/"/>} />
				<Route path='/notification' element={authUser ? <NotificationPage /> : <Navigate  to="/login" />} />
				<Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate  to="/login" />} />
				
			</Routes>
			{authUser && <RightPanel/>}
			<Toaster/>
		</div>
	);
}

export default App
