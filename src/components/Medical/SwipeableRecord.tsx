import React from 'react';
import { motion, type PanInfo, useAnimation } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface SwipeableRecordProps {
  children: React.ReactNode;
  onDelete: () => void;
  canDelete?: boolean;
}

export const SwipeableRecord: React.FC<SwipeableRecordProps> = ({ children, onDelete, canDelete = true }) => {
  const controls = useAnimation();

  const handleDragEnd = async (_: any, info: PanInfo) => {
    // If swiped left more than 100px
    if (info.offset.x < -100) {
      await controls.start({ x: '-100%', transition: { duration: 0.2 } });
      onDelete();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  };

  if (!canDelete) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Delete Background */}
      <div className="absolute inset-0 bg-destructive flex items-center justify-end px-6">
        <div className="flex flex-col items-center gap-1 text-white">
          <Trash2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
        </div>
      </div>

      {/* Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative z-10 bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
};
