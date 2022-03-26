// NOTES : In order to use the DownloadDataCompleted Method, call must be asynchronous.
// MongoDB BSONdocument should work better than RDS.
// Remember to change the file refs to linux systems when you move to production env.

using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.ComponentModel;
using System.IO.Compression;
using System.Diagnostics;
using MongoDB.Driver;


namespace PullMethod
{
    public class AsyncCall
    {		

		 public static async Task InitWebCli()
        {
            //async call for data
            System.Uri url = new Uri ("http://download.cms.gov/nppes/NPPES_Data_Dissemination_May_2019.zip");
            WebClient client = new WebClient();
            client.DownloadFileCompleted += new AsyncCompletedEventHandler  (webClient_DownloadFileCompleted);
             await client.DownloadFileTaskAsync((url), @"c:\\data\\a.zip");
			 
		



		}

		static void webClient_DownloadFileCompleted(object s, AsyncCompletedEventArgs e)
		{
         	//zipArchive Method to extract file 
			string zipPath = @"c:\\data\\a.zip";
			string outPutDirec = @"c:\\microservices\\c#\\aysncproj\\";
			string extractPath = zipPath;
			

			extractPath = Path.GetFullPath(extractPath); 

			 if (!extractPath.EndsWith(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal))
            extractPath += Path.DirectorySeparatorChar;

			using (ZipArchive archive = ZipFile.OpenRead(zipPath))
				{
					foreach (ZipArchiveEntry entry in archive.Entries)
						if (entry.Length > 7000000000)
						{
							var full = Path.Combine(outPutDirec, entry.Name);
							entry.ExtractToFile(full);

							//System Process edits csv file to comply with mongodb standards
							using (Process editProcess = new Process())
							{
								 
								


								editProcess.StartInfo.FileName = "sed";
								editProcess.StartInfo.ArgumentList.Add("-e");
								editProcess.StartInfo.ArgumentList.Add("s/\\./\\ /");
								editProcess.StartInfo.ArgumentList.Add(@entry.Name);

								editProcess.Start();
								//Ensures the sed process is complete before 
								editProcess.WaitForExit();
								
							}


								//Inserts Document into Db instance;
								string connectionString = "mongodb://localhost:27017";

								var dbClient = new MongoClient(connectionString); 
								var db = dbClient.GetDatabase("msg_Storage");
								//I can't find a method in the Docs that empties the collection
								db.DropCollection("National_id");
								db.CreateCollection("National_id");

								using (Process importProcess = new Process())
								{
									importProcess.StartInfo.FileName = "mongoimport";
									importProcess.StartInfo.Arguments =  "-d msg_Storage -c National_id --type csv --headerline --file" + " " +  entry.Name;

									importProcess.Start();
									importProcess.WaitForExit();

									
								//Deletes file so new instance can replace it.
								File.Delete(full);

								}
				
						}
					
				}
				
		}

		 
	}

		
}