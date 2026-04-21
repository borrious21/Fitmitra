export const getMockResponse = (endpoint, options = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (endpoint.includes('/profile/me')) {
        resolve({
          id: 'mock-123',
          full_name: 'Dev User',
          email: 'dev@fitmitra.local',
          age: 26,
          gender: 'male',
          weight_kg: 75,
          height_cm: 180,
          goal: 'build_muscle'
        });
      }
      else if (endpoint.includes('/dashboard/nutrition/today')) {
        resolve({
          calories: { consumed: 1200, target: 2500 },
          water_L: { consumed: 1.5, target: 3 }
        });
      }
      else if (endpoint.includes('/dashboard/workout/today')) {
        resolve({
          today: { calories_burned: 450 }
        });
      }
      else if (endpoint.includes('/dashboard/meals/today')) {
        resolve({
          meals: [
            { meal_type: 'breakfast', time: '08:30 AM', total_kcal: 450, foods: [{name: 'Oats'}, {name: 'Eggs'}] },
            { meal_type: 'lunch', time: '01:15 PM', total_kcal: 750, foods: [{name: 'Chicken Breast'}, {name: 'Rice'}] }
          ]
        });
      }
      else if (endpoint.includes('/dashboard/streak')) {
        resolve({
          current_streak: 15,
          level: 4
        });
      }
      else if (endpoint.includes('/progress/log')) {
        if (options.method === 'POST') {
          // Acknowledge the write but don't persist (mock mode)
          const body = options.body ? JSON.parse(options.body) : {};
          resolve({ success: true, data: { ...body, id: Date.now() } });
        } else {
          resolve([
            { log_date: '2026-04-10T00:00:00Z', weight_kg: 74.5, sleep_hours: 7.5, heart_rate: 65, energy_level: 8 },
            { log_date: '2026-04-09T00:00:00Z', weight_kg: 74.8, sleep_hours: 6.5, heart_rate: 68, energy_level: 6 },
            { log_date: '2026-04-08T00:00:00Z', weight_kg: 75.0, sleep_hours: 8, heart_rate: 62, energy_level: 9 }
          ]);
        }
      }
      else if (endpoint.includes('/plans/gamification')) {
        resolve({
          level: { current: 3, progress_pct: 45, xp_to_next: 1200 },
          streak: { current: 15 },
          xp: 4500,
          badges: [{ id: 1, label: 'Early Bird' }, { id: 2, label: 'Consistency' }]
        });
      }
      else if (endpoint.includes('/plans/active')) {
        // Resolve null so Plans page shows "No Active Plan" empty state correctly
        resolve(null);
      }
      else if (endpoint.includes('/plans/generate')) {
        resolve({ success: true });
      }
      else if (endpoint.includes('/auth/login')) {
        resolve({
          token: 'mock-jwt-token',
          user: {
            id: 'mock-123',
            name: 'Dev User',
            email: 'dev@fitmitra.local',
            role: 'user',
            isVerified: true,
            has_completed_onboarding: true
          }
        });
      }
      else if (endpoint.includes('/auth/me') || endpoint.includes('/profile/me')) {
        resolve({
          id: 'mock-123',
          name: 'Dev User',
          email: 'dev@fitmitra.local',
          role: 'user',
          isVerified: true,
          has_completed_onboarding: true,
          weight_kg: 75,
          height_cm: 180,
          goal: 'build_muscle'
        });
      }
      else {
        resolve(null);
      }
    }, 500); // 500ms delay to show the nice loading screen briefly
  });
};
