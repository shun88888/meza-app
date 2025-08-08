'use client'

import { useState } from 'react'

export default function AnalyticsPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  
  // フィルター期間に応じたデータ
  const getDataByFilter = () => {
    switch (activeFilter) {
      case 'This week':
        return {
          successRate: '100%',
          clearTask: 1,
          penaltyMoney: '1,500',
          totalTime: '12h 33m',
          productivity: '75%',
          spending: '56,70%'
        }
      case 'Monthly':
        return {
          successRate: '85%',
          clearTask: 25,
          penaltyMoney: '12,000',
          totalTime: '320h 15m',
          productivity: '82%',
          spending: '42,30%'
        }
      case 'Yearly':
        return {
          successRate: '78%',
          clearTask: 289,
          penaltyMoney: '156,700',
          totalTime: '3,840h 22m',
          productivity: '79%',
          spending: '38,90%'
        }
      default: // All
        return {
          successRate: '92%',
          clearTask: 365,
          penaltyMoney: '23,400',
          totalTime: '4,512h 45m',
          productivity: '84%',
          spending: '45,60%'
        }
    }
  }
  
  const currentData = getDataByFilter()
  return (
    <div style={{ minHeight: '100vh', background: 'rgb(255, 255, 255)' }}>
      <div style={{ width: '413px', height: '894px', position: 'relative', margin: '0 auto' }}>
        {/* Profile Picture */}
        <div style={{ position: 'absolute', top: '41px', left: '326px', width: '46px', height: '46px' }}>
          <img 
            src="#" 
            alt="プロフィール画像" 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%',
              objectFit: 'cover'
            }} 
          />
        </div>
        
        {/* Notification Icon */}
        <div style={{ position: 'absolute', top: '53px', left: '295px', width: '20px', height: '23px' }}>
          <img src="#" alt="通知" style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Main Yellow Card */}
        <button style={{
          position: 'absolute',
          top: '240px',
          left: '41px',
          width: '330px',
          height: '217px',
          background: 'rgb(255, 210, 31)',
          borderRadius: '22px',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}>
          {/* Icon on card */}
          <div style={{ position: 'absolute', top: '17px', right: '8px', width: '196px', height: '199px' }}>
            <img 
              src="/images/illustrations/main-card-design.png" 
              alt="メインアイコン" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          
          {/* Success Rate Text */}
          <div style={{
            position: 'absolute',
            top: '131px',
            left: '20px',
            fontSize: '40px',
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: '40px',
            letterSpacing: '-0.05em'
          }}>
            {currentData.successRate}
          </div>
          
          {/* Period Text */}
          <div style={{
            position: 'absolute',
            top: '179px',
            left: '20px',
            fontSize: '16px',
            color: '#ffffff',
            lineHeight: '16px',
            letterSpacing: '-0.05em'
          }}>
            {activeFilter === 'All' ? 'All time' : activeFilter}
          </div>
          
          {/* Background Icon */}
          <div style={{ position: 'absolute', top: '76px', right: '7px', width: '147px', height: '141px' }}>
            <img 
              src="/images/illustrations/main-card-design.png" 
              alt="背景アイコン" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        </button>

        {/* Success Rate Cards */}
        <button style={{
          position: 'absolute',
          top: '457px',
          left: '41px',
          width: '165px',
          height: '165px',
          background: 'rgb(255, 222, 89)',
          borderRadius: '29px',
          opacity: 0.87,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}></button>

        <button style={{
          position: 'absolute',
          top: '457px',
          left: '207px',
          width: '165px',
          height: '165px',
          background: 'rgb(255, 243, 194)',
          borderRadius: '29px',
          opacity: 0.67,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}></button>

        {/* Bottom Navigation Cards */}
        <button style={{
          position: 'absolute',
          top: '687px',
          left: '41px',
          width: '128px',
          height: '79px',
          background: 'rgb(255, 243, 194)',
          borderRadius: '48px',
          opacity: 0.33,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}></button>

        <button style={{
          position: 'absolute',
          top: '687px',
          left: '185px',
          width: '128px',
          height: '79px',
          background: 'rgb(255, 243, 194)',
          borderRadius: '48px',
          opacity: 0.33,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}></button>

        <button style={{
          position: 'absolute',
          top: '687px',
          left: '329px',
          width: '128px',
          height: '79px',
          background: 'rgb(255, 243, 194)',
          borderRadius: '48px',
          opacity: 0.33,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}></button>

        {/* Decorative Elements */}
        <div style={{ position: 'absolute', top: '503px', left: '42px', width: '164px', height: '119px' }}>
          <img 
            src="/images/illustrations/card-circle-upper.png" 
            alt="装飾要素" 
            style={{ width: '100%', height: '100%', transform: 'scaleY(-1)' }} 
          />
        </div>

        <div style={{ position: 'absolute', top: '457px', left: '208px', width: '164px', height: '119px', transform: 'rotate(180deg)' }}>
          <img 
            src="/images/illustrations/card-circle-bottom.png" 
            alt="装飾要素" 
            style={{ width: '100%', height: '100%', transform: 'scaleY(-1)' }} 
          />
        </div>

        {/* Filter Buttons */}
        <button 
          onClick={() => setActiveFilter('All')}
          style={{
            position: 'absolute',
            top: '168px',
            left: '41px',
            width: '51px',
            height: '33px',
            background: activeFilter === 'All' ? 'rgb(255, 243, 194)' : 'rgb(230, 230, 230)',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        ></button>

        <button 
          onClick={() => setActiveFilter('This week')}
          style={{
            position: 'absolute',
            top: '168px',
            left: '103px',
            width: '82px',
            height: '33px',
            background: activeFilter === 'This week' ? 'rgb(255, 243, 194)' : 'rgb(230, 230, 230)',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        ></button>

        <button 
          onClick={() => setActiveFilter('Monthly')}
          style={{
            position: 'absolute',
            top: '168px',
            left: '197px',
            width: '82px',
            height: '33px',
            background: activeFilter === 'Monthly' ? 'rgb(255, 243, 194)' : 'rgb(230, 230, 230)',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        ></button>

        <button 
          onClick={() => setActiveFilter('Yearly')}
          style={{
            position: 'absolute',
            top: '168px',
            left: '290px',
            width: '82px',
            height: '33px',
            background: activeFilter === 'Yearly' ? 'rgb(255, 243, 194)' : 'rgb(230, 230, 230)',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
        ></button>

        {/* Circular Elements */}
        <div style={{
          position: 'absolute',
          top: '132px',
          left: '347px',
          width: '24px',
          height: '24px',
          background: '#000000',
          borderRadius: '50%'
        }}></div>

        <div style={{ position: 'absolute', top: '138px', left: '354px', width: '11px', height: '11px' }}>
          <img src="#" alt="アイコン" style={{ width: '100%', height: '100%' }} />
        </div>

        <div style={{
          position: 'absolute',
          top: '254px',
          left: '322px',
          width: '33px',
          height: '33px',
          background: '#000000',
          borderRadius: '50%'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '468px',
          left: '161px',
          width: '33px',
          height: '33px',
          background: '#000000',
          borderRadius: '50%'
        }}></div>

        <div style={{
          position: 'absolute',
          top: '468px',
          left: '323px',
          width: '33px',
          height: '33px',
          background: 'rgb(255, 49, 49)',
          borderRadius: '50%'
        }}></div>

        {/* Arrow Icons */}
        <div style={{ position: 'absolute', top: '266px', left: '332px', width: '14px', height: '7px' }}>
          <img 
            src="/images/illustrations/arrow-icon.png" 
            alt="矢印" 
            style={{ width: '100%', height: '100%', transform: 'scaleY(-1)' }} 
          />
        </div>

        <div style={{ position: 'absolute', top: '480px', left: '171px', width: '14px', height: '7px' }}>
          <img 
            src="/images/illustrations/arrow-icon.png" 
            alt="矢印" 
            style={{ width: '100%', height: '100%', transform: 'scaleY(-1)' }} 
          />
        </div>

        <div style={{ 
          position: 'absolute', 
          top: '482px', 
          left: '332px', 
          width: '14px', 
          height: '7px',
          transform: 'rotate(180deg)'
        }}>
          <img 
            src="/images/illustrations/arrow-icon.png" 
            alt="矢印" 
            style={{ width: '100%', height: '100%', transform: 'scaleY(-1)' }} 
          />
        </div>

        {/* Text Labels */}
        <div style={{
          position: 'absolute',
          top: '41px',
          left: '41px',
          fontSize: '21px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '21px'
        }}>
          Good Morning,<br />Herper Russo
        </div>

        {/* Clear Task Number */}
        <div style={{
          position: 'absolute',
          top: '539px',
          left: '58px',
          fontSize: '40px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '40px'
        }}>
          {currentData.clearTask}
        </div>

        {/* Penalty Money Amount */}
        <div style={{
          position: 'absolute',
          top: '539px',
          left: '219px',
          fontSize: '40px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '40px'
        }}>
          {currentData.penaltyMoney}
        </div>

        <div style={{
          position: 'absolute',
          top: '133px',
          left: '41px',
          fontSize: '19px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '18px'
        }}>
          Task Overview
        </div>

        <div style={{
          position: 'absolute',
          top: '652px',
          left: '41px',
          fontSize: '19px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '18px'
        }}>
          Overview Statistics
        </div>

        <div style={{
          position: 'absolute',
          top: '260px',
          left: '61px',
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '24px'
        }}>
          Success Rates
        </div>

        <div style={{
          position: 'absolute',
          top: '474px',
          left: '58px',
          fontSize: '16px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          Clear Task
        </div>

        <div style={{
          position: 'absolute',
          top: '702px',
          left: '49px',
          fontSize: '16px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          {currentData.totalTime}
        </div>

        <div style={{
          position: 'absolute',
          top: '702px',
          left: '193px',
          fontSize: '16px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          {currentData.productivity}
        </div>

        <div style={{
          position: 'absolute',
          top: '743px',
          left: '49px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px'
        }}>
          Total Time
        </div>

        <div style={{
          position: 'absolute',
          top: '743px',
          left: '193px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px'
        }}>
          Productivity
        </div>

        <div style={{
          position: 'absolute',
          top: '474px',
          left: '219px',
          fontSize: '16px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          Penalty<br />Money
        </div>

        <div style={{
          position: 'absolute',
          top: '587px',
          left: '58px',
          fontSize: '16px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          Permanent Task
        </div>

        <div style={{
          position: 'absolute',
          top: '587px',
          left: '219px',
          fontSize: '16px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          this week
        </div>

        <div style={{
          position: 'absolute',
          top: '177px',
          left: '53px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px',
          pointerEvents: 'none'
        }}>
          All
        </div>

        <div style={{
          position: 'absolute',
          top: '177px',
          left: '123px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px',
          pointerEvents: 'none'
        }}>
          This week
        </div>

        <div style={{
          position: 'absolute',
          top: '177px',
          left: '217px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px',
          pointerEvents: 'none'
        }}>
          Monthly
        </div>

        <div style={{
          position: 'absolute',
          top: '177px',
          left: '310px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px',
          pointerEvents: 'none'
        }}>
          Yearly
        </div>

        {/* Spending Percentage */}
        <div style={{
          position: 'absolute',
          top: '702px',
          left: '337px',
          fontSize: '16px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '16px'
        }}>
          {currentData.spending}
        </div>

        <div style={{
          position: 'absolute',
          top: '743px',
          left: '337px',
          fontSize: '13px',
          color: '#000000',
          fontFamily: 'Bricolage Grotesque',
          letterSpacing: '-0.05em',
          lineHeight: '13px'
        }}>
          Spending
        </div>

        <div style={{
          position: 'absolute',
          top: '568px',
          left: '313px',
          fontSize: '16px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Canva Sans'
        }}>
          /¥
        </div>

        <div style={{
          position: 'absolute',
          top: '559px',
          left: '97px',
          fontSize: '16px',
          fontWeight: '700',
          color: '#000000',
          fontFamily: 'Canva Sans'
        }}>
          /days
        </div>
      </div>
    </div>
  )
}