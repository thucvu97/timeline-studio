import React from 'react'
import { Hero3DLogo } from '../components/Hero3DLogo'

export const Logo3D: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <Hero3DLogo />
      
      {/* Info panel */}
      {/* <div className="fixed bottom-10 left-10 right-10 z-50">
        <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-white mb-2">3D Logo Technologies:</h3>
          <ul className="text-gray-300 space-y-1 text-sm">
            <li>• <strong>Framer Motion</strong> - for smooth animations and mouse tracking</li>
            <li>• <strong>CSS 3D Transforms</strong> - for perspective and 3D text effects</li>
            <li>• <strong>Parallax Layers</strong> - different movement speeds for depth</li>
            <li>• <strong>Mouse-follow Lighting</strong> - radial gradient that follows cursor</li>
            <li>• <strong>Animated Clouds</strong> - multiple layers with opacity changes</li>
            <li>• <strong>Depth of Field</strong> - gradient overlays for atmospheric perspective</li>
          </ul>
        </div>
      </div> */}
    </div>
  )
}

export default Logo3D