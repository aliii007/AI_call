import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  Target,
  Clock,
  MessageCircle,
  Award
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const callsData = [
  { name: 'Mon', calls: 12, successful: 9 },
  { name: 'Tue', calls: 19, successful: 14 },
  { name: 'Wed', calls: 15, successful: 12 },
  { name: 'Thu', calls: 22, successful: 16 },
  { name: 'Fri', calls: 18, successful: 15 },
  { name: 'Sat', calls: 8, successful: 6 },
  { name: 'Sun', calls: 5, successful: 4 },
];

const performanceData = [
  { name: 'Week 1', score: 72 },
  { name: 'Week 2', score: 76 },
  { name: 'Week 3', score: 81 },
  { name: 'Week 4', score: 85 },
];

const suggestionData = [
  { name: 'Objection Handling', value: 35, color: '#3b82f6' },
  { name: 'Closing', value: 25, color: '#10b981' },
  { name: 'Questions', value: 20, color: '#f59e0b' },
  { name: 'Pricing', value: 15, color: '#ef4444' },
  { name: 'Features', value: 5, color: '#8b5cf6' },
];

const topPerformers = [
  { name: 'Sarah Johnson', calls: 47, success: 85, improvement: 8 },
  { name: 'Mike Chen', calls: 52, success: 79, improvement: -2 },
  { name: 'Emma Davis', calls: 38, success: 91, improvement: 12 },
  { name: 'Alex Rodriguez', calls: 44, success: 73, improvement: 5 },
];

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m'>('30d');

  const metrics = [
    {
      title: 'Total Calls',
      value: '342',
      change: '+12%',
      positive: true,
      icon: MessageCircle,
    },
    {
      title: 'Success Rate',
      value: '73.2%',
      change: '+5.1%',
      positive: true,
      icon: Target,
    },
    {
      title: 'Avg Duration',
      value: '28m 14s',
      change: '-1m 32s',
      positive: false,
      icon: Clock,
    },
    {
      title: 'AI Effectiveness',
      value: '89.4%',
      change: '+7.8%',
      positive: true,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and performance metrics for your AI-assisted sales calls.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
          </select>
          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={metric.title} hover>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <metric.icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                  <span className={`
                    ml-2 text-sm font-medium flex items-center
                    ${metric.positive ? 'text-success-600' : 'text-error-600'}
                  `}>
                    {metric.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Overview */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Calls Overview</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded-full mr-2" />
                Total Calls
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success-600 rounded-full mr-2" />
                Successful
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calls" fill="#3b82f6" />
              <Bar dataKey="successful" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Trend */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
            <span className="text-sm text-gray-600">Average Score</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Suggestions Breakdown */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Suggestions Used</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={suggestionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {suggestionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {suggestionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performers */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
              <Button variant="secondary" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-medium">
                      {performer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name}</p>
                      <p className="text-sm text-gray-600">{performer.calls} calls this month</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{performer.success}%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                    <div className={`
                      flex items-center text-sm font-medium
                      ${performer.improvement > 0 ? 'text-success-600' : 'text-error-600'}
                    `}>
                      {performer.improvement > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(performer.improvement)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};