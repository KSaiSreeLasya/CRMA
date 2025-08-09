import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  HStack,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Flex,
  Tooltip,
  Badge,
  Heading,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  useColorModeValue,
  Circle,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { PROJECT_STAGES } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
} from '@chakra-ui/icons';

interface Project {
  id: string;
  status: string;
  current_stage: string;
  proposal_amount: number;
  created_at: string;
  start_date: string;
  kwh: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  helpText?: string;
  trend?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, helpText, trend }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);

  return (
    <Card bg={cardBg} shadow="sm" border="1px solid" borderColor="gray.100" _hover={{ shadow: 'md' }} transition="all 0.2s">
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Box flex="1">
            <Stat>
              <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
                {title}
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={`${color}.600`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </StatNumber>
              {helpText && (
                <StatHelpText color="gray.500" fontSize="xs">
                  {helpText}
                </StatHelpText>
              )}
            </Stat>
          </Box>
          <Circle size="12" bg={iconBg}>
            <Text fontSize="xl" color={`${color}.600`}>{icon}</Text>
          </Circle>
        </Flex>
      </CardBody>
    </Card>
  );
};

// Group stages for better visualization
const STAGE_GROUPS = [
  { name: 'Advance Payment', stages: ['Advance Payment Done', 'Advance Payment -- Approvals / First Payment'], color: 'blue' },
  { name: 'Approvals & Loan', stages: ['Approvals -- Loan Applications', 'Loan Started -- Loan Process', 'Loan Approved / First Payment Collected -- Material Order'], color: 'purple' },
  { name: 'Materials', stages: ['Materials Ordered -- Materials Deliver', 'Materials Delivered -- Installation'], color: 'orange' },
  { name: 'Installation', stages: ['Installation Done / Second Payment Done -- Net meter Application'], color: 'teal' },
  { name: 'Net Metering', stages: ['Net Meter Application -- Net Meter Installation', 'Net Meter Installed -- Inspection / Final Payment'], color: 'green' },
  { name: 'Finalization', stages: ['Approved Inspection -- Subsidy in Progress', 'Subsidy Disbursed -- Final payment', 'Final Payment Done'], color: 'red' }
];

const Reports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    totalKWH: 0,
  });
  const [stageStats, setStageStats] = useState<Record<string, number>>({});
  const [monthlyKWH, setMonthlyKWH] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current year and create an array of years (current year and 4 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Check if current user is contact@axisogreen.in
  const isRestrictedUser = user?.email === 'contact@axisogreen.in';

  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching projects from Supabase...');
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'deleted');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Projects fetched:', projects);

      if (projects) {
        // Filter projects for selected year
        const yearProjects = projects.filter((project: Project) => {
          const projectDate = new Date(project.start_date || project.created_at);
          return projectDate.getFullYear() === selectedYear;
        });

        const active = projects.filter((p: Project) => p.status === 'active');
        const completed = projects.filter((p: Project) => p.status === 'completed');
        const totalRevenue = projects.reduce((sum: number, p: Project) => sum + (p.proposal_amount || 0), 0);
        const totalKWH = projects.reduce((sum: number, p: Project) => sum + (p.kwh || 0), 0);

        // Count unique customers
        const customerMap: Record<string, boolean> = {};
        projects.forEach(p => {
          if (p.customer_name) customerMap[p.customer_name] = true;
        });
        const uniqueCustomersCount = Object.keys(customerMap).length;

        setStats({
          totalCustomers: uniqueCustomersCount,
          activeProjects: active.length,
          completedProjects: completed.length,
          totalRevenue,
          totalKWH,
        });

        // Calculate projects in each stage (excluding deleted projects)
        const stages: Record<string, number> = {};
        PROJECT_STAGES.forEach(stage => {
          stages[stage] = projects.filter((p: Project) => p.current_stage === stage).length;
        });
        setStageStats(stages);

        // Calculate monthly KWH usage for the selected year
        const monthlyKWHData: Record<string, number> = {
          'January': 0, 'February': 0, 'March': 0, 'April': 0, 'May': 0, 'June': 0,
          'July': 0, 'August': 0, 'September': 0, 'October': 0, 'November': 0, 'December': 0
        };
        
        const monthNames = Object.keys(monthlyKWHData);
        
        yearProjects.forEach((project: Project) => {
          const dateToUse = project.start_date || project.created_at;
          const projectDate = new Date(dateToUse);
          const projectMonth = projectDate.getMonth(); // 0-11
          
          if (project.kwh) {
            monthlyKWHData[monthNames[projectMonth]] += project.kwh;
          }
        });
        
        setMonthlyKWH(monthlyKWHData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the maximum KWH for any month to set the bar scale
  const maxMonthlyKWH = monthlyKWH ? Math.max(...Object.values(monthlyKWH), 1) : 1;

  // Calculate maximum projects in any stage for scaling
  const maxProjectsInStage = Math.max(...Object.values(stageStats), 1);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <VStack spacing={6}>
          <Text fontSize="6xl" color="green.500">📊</Text>
          <Text fontSize="lg" color="gray.600">Loading reports...</Text>
          <Progress size="md" isIndeterminate w="300px" colorScheme="green" borderRadius="full" />
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" minH="400px" borderRadius="lg">
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">Error Loading Reports</AlertTitle>
        <AlertDescription maxWidth="sm" textAlign="center">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="gray.800" mb={2}>
              Reports & Analytics
            </Heading>
            <Text color="gray.600">
              Comprehensive insights and project analytics for {selectedYear}
            </Text>
          </Box>
          <HStack spacing={4}>
            <CalendarIcon color="gray.500" />
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              width="120px"
              size="sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: isRestrictedUser ? 4 : 5 }} spacing={6}>
          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon="👥"
            color="blue"
            helpText="Unique customers"
          />
          <StatsCard
            title="Active Projects"
            value={stats.activeProjects}
            icon="📊"
            color="green"
            helpText="In progress"
          />
          <StatsCard
            title="Completed Projects"
            value={stats.completedProjects}
            icon="✅"
            color="purple"
            helpText="Successfully delivered"
          />
          {!isRestrictedUser && (
            <StatsCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon="💰"
              color="orange"
              helpText="Project value"
            />
          )}
          <StatsCard
            title="Total Capacity"
            value={`${stats.totalKWH.toLocaleString()} kW`}
            icon="⚡"
            color="yellow"
            helpText="Energy capacity"
          />
        </SimpleGrid>

        {/* Monthly KWH Chart */}
        <Card bg={cardBg} shadow="sm" border="1px solid" borderColor="gray.100">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="md" color="gray.800">Monthly Capacity Distribution</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  KWH capacity by project start month for {selectedYear}
                </Text>
              </Box>
              <Text fontSize="xl" color="green.500">📊</Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Flex height="280px" alignItems="flex-end" mb="4" p={4}>
              {Object.entries(monthlyKWH).map(([month, kwh]) => (
                <VStack key={month} flex="1" spacing="2">
                  <Tooltip label={`${kwh.toLocaleString()} kW in ${month}`} hasArrow>
                    <Box 
                      height={`${Math.max((kwh / maxMonthlyKWH) * 200, kwh ? 20 : 0)}px`}
                      width="80%" 
                      bgGradient="linear(to-t, green.400, green.600)"
                      borderTopRadius="md"
                      position="relative"
                      cursor="pointer"
                      _hover={{ 
                        bgGradient: "linear(to-t, green.500, green.700)",
                        transform: "scaleY(1.05)",
                      }}
                      transition="all 0.2s"
                    >
                      {kwh > 0 && (
                        <Text 
                          position="absolute"
                          top="-30px"
                          left="50%"
                          transform="translateX(-50%)"
                          color="gray.700"
                          fontWeight="bold"
                          fontSize="xs"
                          width="80px"
                          textAlign="center"
                        >
                          {kwh.toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  </Tooltip>
                  <Text 
                    fontSize="xs" 
                    fontWeight="medium" 
                    color="gray.600"
                    textAlign="center"
                  >
                    {month.substring(0, 3)}
                  </Text>
                </VStack>
              ))}
            </Flex>
          </CardBody>
        </Card>

        {/* Project Stages Distribution */}
        <Card bg={cardBg} shadow="sm" border="1px solid" borderColor="gray.100">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="md" color="gray.800">Project Stages Distribution</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Current progress across all active projects
                </Text>
              </Box>
              <Text fontSize="xl" color="green.500">📋</Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {STAGE_GROUPS.map((group) => (
                <Box key={group.name}>
                  <Flex align="center" mb={4}>
                    <Badge 
                      colorScheme={group.color} 
                      px={3} 
                      py={1} 
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {group.name}
                    </Badge>
                    <Text ml={3} fontSize="sm" fontWeight="medium" color="gray.600">
                      {group.stages.reduce((count, stage) => count + (stageStats[stage] || 0), 0)} projects
                    </Text>
                  </Flex>
                  
                  <VStack spacing={3} align="stretch">
                    {group.stages.map(stage => {
                      const count = stageStats[stage] || 0;
                      const percentage = maxProjectsInStage > 0 ? Math.round((count / maxProjectsInStage) * 100) : 0;
                      
                      return (
                        <Tooltip 
                          key={stage} 
                          label={`${count} project${count !== 1 ? 's' : ''} in "${stage}" stage`} 
                          hasArrow
                        >
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="sm" color="gray.700" fontWeight="medium" noOfLines={1}>
                                {stage}
                              </Text>
                              <Badge 
                                colorScheme={count > 0 ? group.color : 'gray'} 
                                variant={count > 0 ? 'solid' : 'outline'}
                                fontSize="xs"
                              >
                                {count}
                              </Badge>
                            </HStack>
                            <Progress
                              value={count > 0 ? Math.max(percentage, 8) : 0}
                              height="8px"
                              borderRadius="full"
                              colorScheme={group.color}
                              bg="gray.100"
                            />
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Reports;
