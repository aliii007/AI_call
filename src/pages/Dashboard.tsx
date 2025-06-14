import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  PlayCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const stats = [
  { name: 'Total Calls', value: '47', icon: Phone, change: '+12%', positive: true },
  { name: 'Success Rate', value: '73%', icon: Target, change: '+5%', positive: true },
  { name: 'Avg Duration', value: '28m', icon: Clock, change: '-2m', positive: false },
  { name: 'AI Suggestions Used', value: '89%', icon: TrendingUp, change: '+8%', positive: true },
];

const recentCalls = [
  { id: '1', client: 'Acme Corp', duration: '34m', status: 'completed', score: 85 },
  { id: '2', client: 'TechStart Inc', duration: '22m', status: 'completed', score: 72 },
  { id: '3', client: 'Global Solutions', duration: '45m', status: 'completed', score: 91 },
  { id: '4', client: 'Innovation Labs', duration: '18m', status: 'completed', score: 68 },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your sales calls today.
          </p>
        </div>
        <Button variant="primary" size="lg">
          <PlayCircle className="h-5 w-5 mr-2" />
          Start New Call
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <span className={`
                      ml-2 text-sm font-medium
                      ${stat.positive ? 'text-success-600' : 'text-error-600'}
                    `}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
              <Button variant="secondary" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {recentCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-medium">
                      {call.client.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{call.client}</p>
                      <p className="text-sm text-gray-600">{call.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${call.score >= 80 
                        ? 'bg-success-100 text-success-600' 
                        : call.score >= 70 
                        ? 'bg-warning-100 text-warning-600'
                        : 'bg-error-100 text-error-600'
                      }
                    `}>
                      {call.score}%
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                      {call.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="primary" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-3" />
                Start Call
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-3" />
                Upload Document
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-3" />
                View Analytics
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Calls Completed</span>
                  <span className="font-medium">8/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">AI Suggestions Used</span>
                  <span className="font-medium">24/28</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-success-600 h-2 rounded-full" style={{ width: '86%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium">6/8</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-accent-600 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};