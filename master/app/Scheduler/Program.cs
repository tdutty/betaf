
using Hangfire;
using PullMethod;
using Hangfire.Mongo;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;

namespace scheduler
{
    public class Startup : Hangfire.JobActivator
    {
      public static void Main()
        {
            var migrationOptions = new MongoMigrationOptions
            {
                Strategy = MongoMigrationStrategy.Migrate,
                BackupStrategy = MongoBackupStrategy.Collections
            };

            var storageOptions = new MongoStorageOptions 
            {
                MigrationOptions = migrationOptions
            };



             GlobalConfiguration.Configuration.UseMongoStorage("mongodb://localhost:27017", "job_Storage", storageOptions);    
                
            RecurringJob.AddOrUpdate(() => AsyncCall.InitWebCli(), "0 3 * * 0");
            

        }

        public void DashboardApplication(IApplicationBuilder app)
        {
            app.UseHangfireDashboard();
            app.UseHangfireServer();
        }
    
    }
}
