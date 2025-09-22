import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@portfolioforge.com' },
    update: {},
    create: {
      email: 'demo@portfolioforge.com',
      name: 'Demo User',
    },
  });

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { slug: 'ecommerce-platform-redesign' },
    update: {},
    create: {
      slug: 'ecommerce-platform-redesign',
      folder: 'ecommerce-platform-redesign',
      title: 'E-commerce Platform Redesign',
      summary: 'Complete redesign of an e-commerce platform focusing on user experience and conversion optimization.',
      description: 'Led the redesign of a major e-commerce platform, resulting in 40% increase in conversion rates and improved user satisfaction scores.',
      organization: 'TechCorp Inc.',
      workType: 'UX/UI Design',
      year: 2024,
      role: 'Lead UX Designer',
      seniority: 'Senior',
      categories: 'E-commerce,UX Design,Web Design',
      skills: 'User Research,Prototyping,Usability Testing,Figma',
      tools: 'Figma,Adobe Creative Suite,Hotjar,Google Analytics',
      tags: 'E-commerce,UX,UI,Conversion Optimization',
      highlights: '40% increase in conversion rates,Improved user satisfaction by 25%,Reduced cart abandonment by 30%',
      links: 'live:https://example.com,caseStudy:https://example.com/case-study',
      coverImage: 'https://via.placeholder.com/800x600/5a3cf4/ffffff?text=E-commerce+Redesign',
      caseProblem: 'The existing e-commerce platform had poor conversion rates and high cart abandonment due to confusing navigation and checkout flow.',
      caseActions: 'Conducted user research, created wireframes, developed prototypes, and implemented A/B testing to optimize the user journey.',
      caseResults: 'Achieved 40% increase in conversion rates and 30% reduction in cart abandonment through improved UX design.',
      userId: user.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { slug: 'mobile-app-ux-research' },
    update: {},
    create: {
      slug: 'mobile-app-ux-research',
      folder: 'mobile-app-ux-research',
      title: 'Mobile App UX Research',
      summary: 'Comprehensive UX research and design for a fintech mobile application.',
      description: 'Conducted extensive user research and designed intuitive interfaces for a financial technology mobile application.',
      organization: 'StartupXYZ',
      workType: 'UX Research & Design',
      year: 2024,
      role: 'UX Researcher & Designer',
      seniority: 'Mid-level',
      categories: 'Fintech,Mobile Design,UX Research',
      skills: 'User Interviews,Persona Development,Journey Mapping,Mobile Design',
      tools: 'Sketch,InVision,Maze,UserTesting',
      tags: 'Fintech,Mobile,UX Research,User Testing',
      highlights: 'Conducted 50+ user interviews,Identified key user pain points,Designed intuitive mobile flows',
      links: 'prototype:https://example.com/prototype,research:https://example.com/research',
      coverImage: 'https://via.placeholder.com/800x600/4c1d95/ffffff?text=Mobile+App+Research',
      caseProblem: 'Users struggled with complex financial workflows in the existing mobile app, leading to low engagement and high support tickets.',
      caseActions: 'Conducted user interviews, created personas, mapped user journeys, and designed simplified mobile interfaces.',
      caseResults: 'Improved user satisfaction scores and reduced support tickets by 45% through better UX research and design.',
      userId: user.id,
    },
  });

  // Create sample project files
  await prisma.projectFile.createMany({
    data: [
      {
        name: 'Wireframes',
        filename: 'wireframes.pdf',
        originalName: 'wireframes.pdf',
        mimeType: 'application/pdf',
        size: 2048000,
        url: '/uploads/wireframes.pdf',
        description: 'Initial wireframes for the e-commerce platform redesign',
        tags: 'Wireframes,UX',
        featured: true,
        order: 1,
        projectId: project1.id,
      },
      {
        name: 'User Research Report',
        filename: 'user-research.pdf',
        originalName: 'user-research.pdf',
        mimeType: 'application/pdf',
        size: 1536000,
        url: '/uploads/user-research.pdf',
        description: 'Comprehensive user research findings',
        tags: 'Research,UX',
        featured: true,
        order: 1,
        projectId: project2.id,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:`);
  console.log(`   - 1 user`);
  console.log(`   - 2 projects`);
  console.log(`   - 2 project files`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
