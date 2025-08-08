'use client'

import React from 'react'
import UserHeader from './ui/user-header'
import TimeDisplay from './ui/time-display'
import TaskProgressCard from './ui/task-progress-card'
import StatCard from './ui/stat-card'

const TaskDashboard = () => {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <UserHeader />

      {/* Time Display */}
      <TimeDisplay />

      {/* Main Progress Card */}
      <div className="px-4 mb-6">
        <div className="bg-yellow-400 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white text-4xl font-bold mb-2">100%</div>
              <div className="text-white text-base">Permanent Task</div>
            </div>
            <div className="relative">
              <div className="w-32 h-32 opacity-80">
                <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                  <div className="text-4xl">📱</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-white text-sm">Number of Tasks Performed</div>
          <div className="absolute top-4 right-4 w-8 h-8 bg-black rounded-full"></div>
        </div>
      </div>

      {/* Task Overview Cards */}
      <div className="px-4 mb-8">
        <div className="flex gap-4">
          <StatCard
            title="Clear Task"
            value="1"
            unit="/days"
            subtitle="Permanent Task"
            iconColor="black"
            bgOpacity="medium"
          />
          <StatCard
            title="Penalty Money"
            value="1,500"
            unit="/¥"
            subtitle="this week"
            iconColor="red"
            bgOpacity="light"
          />
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="px-4 mt-auto mb-8">
        <button className="w-full bg-yellow-400 rounded-full py-4 px-6 shadow-lg hover:bg-yellow-500 transition-colors duration-200">
          <span className="text-white text-xl font-bold">Challenge Start</span>
        </button>
      </div>
    </div>
  )
}

export default TaskDashboard