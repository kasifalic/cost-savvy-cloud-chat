
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface DashboardProps {
  billData: any;
}

const Dashboard = ({ billData }: DashboardProps) => {
  if (!billData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <BarChart className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">Upload an AWS bill to see your cost analysis and insights.</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  const optimizationSuggestions = [
    {
      title: 'Right-size EC2 instances',
      description: 'Your EC2 instances are over-provisioned. Consider downsizing to save 25-30%.',
      savings: '$137',
      priority: 'High'
    },
    {
      title: 'Use Reserved Instances',
      description: 'Switch to Reserved Instances for consistent workloads to save up to 40%.',
      savings: '$182',
      priority: 'High'
    },
    {
      title: 'S3 Storage Class Optimization',
      description: 'Move infrequently accessed data to S3 IA or Glacier.',
      savings: '$67',
      priority: 'Medium'
    },
    {
      title: 'Cleanup Unused Resources',
      description: 'Found 3 unused EBS volumes and 2 idle load balancers.',
      savings: '$45',
      priority: 'Medium'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cost Analysis Dashboard</h2>
        <p className="text-gray-600">Billing Period: {billData.billingPeriod}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">${billData.totalCost}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-500">+8.2% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Highest Service</p>
              <p className="text-2xl font-bold text-gray-900">EC2</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">${billData.services[0].cost} (36.6%)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Potential Savings</p>
              <p className="text-2xl font-bold text-green-600">$431</p>
            </div>
            <TrendingDown className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Based on optimization</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">{billData.services.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">Across all regions</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Cost Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={billData.services}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {billData.services.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cost Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={billData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Cost Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={billData.services}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
              <Bar dataKey="cost" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Optimization Recommendations</h3>
        <div className="space-y-4">
          {optimizationSuggestions.map((suggestion, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      suggestion.priority === 'High' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {suggestion.priority} Priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-green-600">{suggestion.savings}</div>
                  <div className="text-sm text-gray-500">potential savings</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
