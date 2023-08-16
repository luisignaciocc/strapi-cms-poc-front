import { fetchAPI } from "@/app/(site)/utils/fetch-api";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

async function getPostBySlug(slug: string) {
  const token = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  const path = `/articles`;
  const urlParamsObject = {
    filters: { slug },
    populate: {
      cover: { fields: ["url"] },
      authorsBio: { populate: "*" },
      category: { fields: ["name"] },
      blocks: { populate: "*" },
    },
  };
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const response = await fetchAPI(path, urlParamsObject, options);
  return response;
}

async function getMetaData(slug: string) {
  const token = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  const path = `/articles`;
  const urlParamsObject = {
    filters: { slug },
    populate: { seo: { populate: "*" } },
  };
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const response = await fetchAPI(path, urlParamsObject, options);
  return response.data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const meta = await getMetaData(params.slug);
  const metadata = meta[0].attributes.seo;

  return {
    title: metadata.metaTitle,
    description: metadata.metaDescription,
  };
}

export default async function PostRoute({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const data = await getPostBySlug(slug);
  if (data.data.length === 0) return <h2>no post found</h2>;

  // there is not a single block with the __component === "shared.html"
  const isLegacy = data.data[0].attributes.blocks.some(
    (block: any) => block.__component === "shared.html"
  );

  if (!isLegacy) {
    redirect(`/`);
  }

  const htmlElement = data.data[0].attributes.blocks.find(
    (block: any) => block.__component === "shared.html"
  );

  return <span dangerouslySetInnerHTML={{ __html: htmlElement.body }} />;
}
