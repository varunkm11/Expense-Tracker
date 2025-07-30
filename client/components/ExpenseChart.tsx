import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  totalExpenses: number;
}

const COLORS = [
  '#F97316', // Orange
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EAB308', // Yellow
  '#EF4444', // Red
  '#10B981', // Green
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

export function ExpenseChart({ data, totalExpenses }: ExpenseChartProps) {
  // Safety check for undefined or null values
  const safeData = data || [];
  const safeTotalExpenses = totalExpenses || 0;
  
  const chartData = safeData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    percentage: safeTotalExpenses > 0 ? ((item.amount / safeTotalExpenses) * 100).toFixed(1) : '0'
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm text-gray-600">
            ₹{data.amount.toLocaleString()} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-amber-500 rounded" />
            <span>Expense Distribution</span>
          </CardTitle>
          <CardDescription>
            Visual breakdown of your spending by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="amount"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend with details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">Category Details</h4>
              {chartData.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-sm">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">₹{item.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{item.percentage}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {chartData.length}
              </div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₹{safeTotalExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{chartData.length > 0 ? Math.round(safeTotalExpenses / chartData.length).toLocaleString() : 0}
              </div>
              <div className="text-sm text-gray-500">Avg per Category</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {chartData.length > 0 ? chartData[0].category : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Top Category</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
