import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex w-full h-screen bg-[#f8fafc] dark:bg-gray-900 transition-colors duration-300 overflow-hidden font-sans text-gray-900 dark:text-gray-100">
            {/* Sidebar remains fixed/static based on its internal logic */}
            <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
            
            {/* Main Content Area: Column Flex */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                {/* Navbar is a fixed-height header */}
                <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

                {/* Content Container: Scrollable area strictly below Navbar and to the right of Sidebar */}
                <main className="flex-1 overflow-y-auto p-4 pb-bottom-nav md:p-8 md:pb-8 custom-scrollbar scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            {/* Mobile Bottom Navigation — Only visible on mobile, fixed at the bottom */}
            <BottomNav />
        </div>
    );
};

export default Layout;
