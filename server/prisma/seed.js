const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create complaint categories
    const categories = await Promise.all([
        prisma.complaintCategory.upsert({
            where: { name: 'Infrastructure' },
            update: {},
            create: { name: 'Infrastructure', description: 'Roads, bridges, buildings, and public facilities' }
        }),
        prisma.complaintCategory.upsert({
            where: { name: 'Sanitation' },
            update: {},
            create: { name: 'Sanitation', description: 'Garbage collection, drainage, and cleanliness' }
        }),
        prisma.complaintCategory.upsert({
            where: { name: 'Public Safety' },
            update: {},
            create: { name: 'Public Safety', description: 'Security, lighting, and safety concerns' }
        }),
        prisma.complaintCategory.upsert({
            where: { name: 'Noise & Disturbance' },
            update: {},
            create: { name: 'Noise & Disturbance', description: 'Noise complaints and public disturbances' }
        }),
        prisma.complaintCategory.upsert({
            where: { name: 'Others' },
            update: {},
            create: { name: 'Others', description: 'Other complaints not covered by other categories' }
        })
    ]);

    console.log('✅ Created complaint categories');

    // Create service categories and services
    const certCategory = await prisma.serviceCategory.upsert({
        where: { name: 'Certificates' },
        update: {},
        create: { name: 'Certificates', description: 'Official barangay certificates and clearances' }
    });

    const permitCategory = await prisma.serviceCategory.upsert({
        where: { name: 'Permits' },
        update: {},
        create: { name: 'Permits', description: 'Business and construction permits' }
    });

    // Create services
    await Promise.all([
        prisma.service.upsert({
            where: { id: 'brgy-clearance' },
            update: {},
            create: {
                id: 'brgy-clearance',
                name: 'Barangay Clearance',
                description: 'General purpose barangay clearance certificate',
                requirements: 'Valid ID, Cedula',
                fee: 50,
                processingDays: 1,
                categoryId: certCategory.id
            }
        }),
        prisma.service.upsert({
            where: { id: 'brgy-id' },
            update: {},
            create: {
                id: 'brgy-id',
                name: 'Barangay ID',
                description: 'Official barangay identification card',
                requirements: 'Valid ID, 1x1 Photo, Proof of Residency',
                fee: 100,
                processingDays: 3,
                categoryId: certCategory.id
            }
        }),
        prisma.service.upsert({
            where: { id: 'indigency' },
            update: {},
            create: {
                id: 'indigency',
                name: 'Certificate of Indigency',
                description: 'For medical, educational, or financial assistance',
                requirements: 'Valid ID, Proof of income/no income',
                fee: 0,
                processingDays: 1,
                categoryId: certCategory.id
            }
        }),
        prisma.service.upsert({
            where: { id: 'business-permit' },
            update: {},
            create: {
                id: 'business-permit',
                name: 'Business Clearance',
                description: 'Clearance for business operations in the barangay',
                requirements: 'DTI/SEC Registration, Valid ID, Contract of Lease',
                fee: 500,
                processingDays: 3,
                categoryId: permitCategory.id
            }
        })
    ]);

    console.log('✅ Created service categories and services');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Remove legacy separate admin account — chairman is the admin
    await prisma.user.deleteMany({ where: { email: 'admin@barangay.gov.ph' } });

    const chairman = await prisma.user.upsert({
        where: { email: 'chairman@barangay.gov.ph' },
        update: {},
        create: {
            email: 'chairman@barangay.gov.ph',
            password: hashedPassword,
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            phone: '09171234567',
            address: 'Barangay Hall',
            role: 'CHAIRMAN',
            isApproved: true
        }
    });

    const secretary = await prisma.user.upsert({
        where: { email: 'secretary@barangay.gov.ph' },
        update: {},
        create: {
            email: 'secretary@barangay.gov.ph',
            password: hashedPassword,
            firstName: 'Maria',
            lastName: 'Santos',
            phone: '09181234567',
            address: 'Barangay Hall',
            role: 'SECRETARY',
            isApproved: true
        }
    });

    const resident = await prisma.user.upsert({
        where: { email: 'resident@example.com' },
        update: {},
        create: {
            email: 'resident@example.com',
            password: hashedPassword,
            firstName: 'Pedro',
            lastName: 'Reyes',
            phone: '09191234567',
            address: '123 Main Street',
            role: 'RESIDENT',
            isApproved: true
        }
    });

    console.log('✅ Created users');

    // Create sample complaints
    await prisma.complaint.createMany({
        skipDuplicates: true,
        data: [
            {
                title: 'Pothole on Main Street',
                description: 'There is a large pothole near the intersection that needs immediate repair. Several vehicles have already been damaged.',
                location: 'Main Street near corner of 2nd Avenue',
                status: 'PENDING',
                priority: 'HIGH',
                userId: resident.id,
                categoryId: categories[0].id
            },
            {
                title: 'Garbage not collected for 3 days',
                description: 'The garbage truck has not passed by our area for the past 3 days. The garbage is piling up and causing bad smell.',
                location: 'Block 5, Lot 10',
                status: 'IN_PROGRESS',
                priority: 'MEDIUM',
                userId: resident.id,
                categoryId: categories[1].id
            },
            {
                title: 'Street light not working',
                description: 'The street light in front of the basketball court has been out for a week. It is very dark and unsafe at night.',
                location: 'Basketball Court Area',
                status: 'RESOLVED',
                priority: 'MEDIUM',
                userId: resident.id,
                categoryId: categories[2].id,
                resolvedAt: new Date()
            }
        ]
    });

    console.log('✅ Created sample complaints');

    // Create sample suggestions
    await prisma.suggestion.createMany({
        skipDuplicates: true,
        data: [
            {
                title: 'Install CCTV cameras in public areas',
                description: 'For improved security, I suggest installing CCTV cameras in key public areas such as the basketball court, plaza, and main intersections.',
                category: 'Security',
                status: 'APPROVED',
                voteCount: 15,
                userId: resident.id
            },
            {
                title: 'Weekly community cleanup drive',
                description: 'Organize a weekly community cleanup drive every Saturday to keep our barangay clean and promote community involvement.',
                category: 'Environment',
                status: 'PENDING',
                voteCount: 8,
                userId: resident.id
            }
        ]
    });

    console.log('✅ Created sample suggestions');

    // Create sample announcements
    await prisma.announcement.createMany({
        skipDuplicates: true,
        data: [
            {
                title: 'Barangay Assembly Meeting',
                content: 'You are all invited to attend the Quarterly Barangay Assembly Meeting on January 30, 2026 at 2:00 PM at the Barangay Hall. Important matters regarding community development will be discussed.',
                category: 'General',
                status: 'PUBLISHED',
                isPinned: true,
                publishDate: new Date(),
                createdById: chairman.id
            },
            {
                title: 'Free Medical Check-up',
                content: 'Free medical check-up and consultation will be available on February 5, 2026 at the Barangay Health Center. Services include blood pressure monitoring, blood sugar testing, and basic consultation.',
                category: 'Health',
                status: 'PUBLISHED',
                publishDate: new Date(),
                createdById: secretary.id
            }
        ]
    });

    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📧 Test Accounts:');
    console.log('   Admin / Chairman: chairman@barangay.gov.ph / password123');
    console.log('   Secretary: secretary@barangay.gov.ph / password123');
    console.log('   Resident: resident@example.com / password123');
}

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Seed error:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = { seed: main };

