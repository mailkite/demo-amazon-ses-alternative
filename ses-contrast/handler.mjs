// CONTRAST (not runnable here): the same "receive one email" on Amazon SES.
// Prerequisites you build first: SES receipt rule set → S3 bucket + bucket policy →
// SNS topic → this Lambda + IAM role. Then the code still has to fetch the raw MIME
// from S3 and parse it itself.
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

const s3 = new S3Client({});

export const handler = async (event) => {
  const { bucketName, objectKey } = event.Records[0].ses.receipt.action;
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));
  const raw = await obj.Body.transformToString();
  const mail = await simpleParser(raw); // headers, body, attachments — your job now
  console.log(mail.from?.text, "·", mail.subject);
};
