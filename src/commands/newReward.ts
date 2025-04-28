import { Message } from 'discord.js';
import { MezonSDK } from 'mezon-sdk';
import { z } from 'zod';

// Define the reward form schema
const rewardFormSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    points: z.number().min(1).max(1000),
    duration: z.number().min(1).max(30), // in days
    requirements: z.array(z.string()).min(1).max(5)
});

type RewardForm = z.infer<typeof rewardFormSchema>;

export async function handleNewReward(message: Message, mezonClient: MezonSDK) {
    try {
        // Create a new reward form
        const form = await mezonClient.createForm({
            type: 'reward',
            title: 'New Reward Creation',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    label: 'Reward Title',
                    required: true,
                    placeholder: 'Enter reward title'
                },
                {
                    name: 'description',
                    type: 'textarea',
                    label: 'Reward Description',
                    required: true,
                    placeholder: 'Enter reward description'
                },
                {
                    name: 'points',
                    type: 'number',
                    label: 'Points Required',
                    required: true,
                    min: 1,
                    max: 1000
                },
                {
                    name: 'duration',
                    type: 'number',
                    label: 'Duration (days)',
                    required: true,
                    min: 1,
                    max: 30
                },
                {
                    name: 'requirements',
                    type: 'multiselect',
                    label: 'Requirements',
                    required: true,
                    options: [
                        { label: 'Level 10+', value: 'level_10' },
                        { label: 'Premium Member', value: 'premium' },
                        { label: 'Active for 30 days', value: 'active_30' },
                        { label: 'Completed 5 tasks', value: 'tasks_5' },
                        { label: 'Referred 3 friends', value: 'referrals_3' }
                    ]
                }
            ]
        });

        // Send the form to the user
        await message.reply({
            content: 'Please fill out the reward form:',
            components: [form]
        });

        // Handle form submission
        const collector = message.channel.createMessageComponentCollector({
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (interaction) => {
            if (interaction.isModalSubmit()) {
                try {
                    const formData = rewardFormSchema.parse(interaction.fields);

                    // Create the reward in Mezon
                    const reward = await mezonClient.createReward({
                        ...formData,
                        createdBy: message.author.id,
                        guildId: message.guild?.id
                    });

                    await interaction.reply({
                        content: `✅ Reward created successfully!\nTitle: ${reward.title}\nPoints: ${reward.points}\nDuration: ${reward.duration} days`,
                        ephemeral: true
                    });
                } catch (error) {
                    await interaction.reply({
                        content: '❌ Error creating reward. Please check your input and try again.',
                        ephemeral: true
                    });
                }
            }
        });

        collector.on('end', () => {
            message.channel.send('Reward creation form expired. Use the command again to create a new reward.');
        });

    } catch (error) {
        console.error('Error handling new reward command:', error);
        await message.reply('❌ An error occurred while creating the reward form. Please try again later.');
    }
} 