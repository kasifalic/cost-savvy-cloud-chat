
import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Server, Database, Cloud, Zap } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface Service {
  name: string;
  cost: number;
  change: number;
  description: string;
}

interface InvoiceData {
  id: string;
  total_cost: number;
  billing_period: string;
  services_data: any;
}

interface DashboardProps {
  billData: any;
}

const Dashboard = ({ billData }: DashboardProps) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestInvoice = async () => {
      try {
        const { data, error } = await supabase
          .from('aws_invoices')
          .select('*')
          .eq('processing_status', 'completed')
          .order('upload_date', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching invoice:', error);
          return;
        }

        if (data && data.length > 0) {
          setInvoiceData(data[0] as InvoiceData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestInvoice();
  }, [billData]);

  const mockData = {
    total_cost: 2847.56,
    services_data: {
      costChange: -12.3,
      services: [
        { name: 'EC2', cost: 1240.50, change: -5.2, description: 'Elastic Compute Cloud' },
        { name: 'S3', cost: 487.30, change: 8.1, description: 'Simple Storage Service' },
        { name: 'RDS', cost: 765.20, change: -2.1, description: 'Relational Database Service' },
        { name: 'Lambda', cost: 354.56, change: 15.3, description: 'Serverless Functions' },
      ],
      recommendations: [
        'Consider Reserved Instances for EC2 - Save up to 30%',
        'Optimize S3 storage classes - Potential $120/month savings',
        'Right-size RDS instances - Save $200/month',
      ]
    }
  };

  const data = invoiceData || mockData;
  const totalCost = data.total_cost || 0;
  const costChange = data.services_data?.costChange || 0;
  const services = data.services_data?.services || [];
  const recommendations = data.services_data?.recommendations || [];

  const getServiceIcon = (serviceName: string | undefined | null) => {
    if (!serviceName || typeof serviceName !== 'string') {
      return Cloud;
    }
    
    switch (serviceName.toLowerCase()) {
      case 'ec2': return Server;
      case 's3': return Database;
      case 'rds': return Database;
      case 'lambda': return Zap;
      default: return Cloud;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
            Loading Dashboard...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Cost Analysis Dashboard
        </h1>
        <p className="text-black">
          {invoiceData ? 'Real data from your AWS invoice' : 'Upload your AWS bill to see real data'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-600/10 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-emerald-400" />
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                Current
              </span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-1">
              ${totalCost.toLocaleString()}
            </h3>
            <p className="text-black text-sm">Total Monthly Cost</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-600/10 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              {costChange < 0 ? (
                <TrendingDown className="h-8 w-8 text-emerald-400" />
              ) : (
                <TrendingUp className="h-8 w-8 text-red-400" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                costChange < 0 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {costChange > 0 ? '+' : ''}{costChange}%
              </span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-1">
              {costChange > 0 ? '+' : ''}${Math.abs(costChange * 23).toFixed(0)}
            </h3>
            <p className="text-black text-sm">vs Last Month</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-coral-600/10 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Server className="h-8 w-8 text-orange-400" />
              <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-1">
              {services.length}
            </h3>
            <p className="text-black text-sm">AWS Services</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-600/10 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Cloud className="h-8 w-8 text-amber-400" />
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                Potential
              </span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-1">
              $450
            </h3>
            <p className="text-black text-sm">Monthly Savings</p>
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-3xl blur-2xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
            <Server className="h-6 w-6 text-teal-400" />
            Service Cost Breakdown
          </h2>
          
          <div className="grid gap-4">
            {services.map((service: Service, index: number) => {
              const Icon = getServiceIcon(service?.name);
              const serviceCost = service?.cost || 0;
              const serviceChange = service?.change || 0;
              const serviceName = service?.name || 'Unknown Service';
              const serviceDescription = service?.description || `Amazon ${serviceName}`;
              
              return (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-xl">
                          <Icon className="h-6 w-6 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-black">{serviceName}</h3>
                          <p className="text-black">{serviceDescription}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-black">
                          ${serviceCost.toLocaleString()}
                        </div>
                        <div className={`flex items-center gap-1 ${
                          serviceChange > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {serviceChange > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {serviceChange > 0 ? '+' : ''}{serviceChange}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-orange-600 rounded-full transition-all duration-1000"
                        style={{ width: `${totalCost ? (serviceCost / totalCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-600/5 rounded-3xl blur-2xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
            <Zap className="h-6 w-6 text-emerald-400" />
            AI Cost Optimization Recommendations
          </h2>
          
          <div className="space-y-4">
            {recommendations.map((rec: string, index: number) => (
              <div key={index} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-600/10 rounded-xl blur-sm"></div>
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg mt-1">
                      <Zap className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-black flex-1">{rec}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
