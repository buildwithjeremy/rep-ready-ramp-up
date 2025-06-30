
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Calendar, Users, Trophy, TrendingUp, Target } from "lucide-react";
import { Trainer, Rep } from "@/types";
import { TrainerContactCard } from "./trainer-contact-card";
import { TrainerScorecard } from "./trainer-scorecard";
import { AllReps } from "@/components/rep/all-reps";

interface TrainerProfileProps {
  trainer: Trainer;
  reps: Rep[];
  onBack: () => void;
  onRepClick: (repId: string) => void;
  onUpdateTrainer?: (trainer: Trainer) => void;
}

export function TrainerProfile({ trainer, reps, onBack, onRepClick, onUpdateTrainer }: TrainerProfileProps) {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'reps'>('scorecard');

  // Filter reps assigned to this trainer
  const trainerReps = reps.filter(rep => rep.trainerId === trainer.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerContactCard trainer={trainer} onBack={onBack} />
      
      <div className="px-4 py-4 space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'scorecard'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('scorecard')}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Scorecard
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reps'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('reps')}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Reps ({trainerReps.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scorecard' && (
          <TrainerScorecard trainer={trainer} />
        )}

        {activeTab === 'reps' && (
          <AllReps
            reps={trainerReps}
            onRepClick={onRepClick}
            title={`${trainer.name}'s Reps`}
          />
        )}
      </div>
    </div>
  );
}
