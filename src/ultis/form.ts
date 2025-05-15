import { EButtonMessageStyle, EMessageComponentType } from "mezon-sdk";
import { getRandomColor } from "./color";
import { MEZON_EMBED_FOOTER } from "./constant";

interface EmbedProps {
  color?: string;
  title?: string;
  url?: string;
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  description?: string;
  thumbnail?: { url: string };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
    options?: any[];
    inputs?: {};
  }>;
  image?: { url: string };
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
}

export const embedTrophy = (
  name: string,
  action: string,
  data?: any
): EmbedProps[] => {
  return [
    {
      color: getRandomColor(),
      title:
        (action == "new" ? "New " : action == "upd " ? "Update " : " ") + name,
      fields: [
        {
          name: "Name",
          value: "",
          inputs: {
            id: `name`,
            type: EMessageComponentType.INPUT,
            component: {
              id: `trophy-name`,
              placeholder: "Ex. Write something",
              required: true,
              textarea: true,
              defaultValue: data?.name || "",
            },
          },
        },
        {
          name: "Description:",
          value: "",
          inputs: {
            id: `description`,
            type: EMessageComponentType.INPUT,
            component: {
              id: `trophy-description`,
              placeholder: "Ex. Write something",
              required: true,
              textarea: true,
              defaultValue: data?.description || "",
            },
          },
        },
        {
          name: "Points:",
          value: "",
          inputs: {
            id: `points`,
            type: EMessageComponentType.INPUT,
            component: {
              id: `trophy-points`,
              placeholder: "Ex. Write something",
              required: true,
              defaultValue: data?.points || 0,
              type: "number",
              step: 1,
            },
          },
        },
      ],
      timestamp: new Date().toISOString(),
      footer: MEZON_EMBED_FOOTER,
    },
  ];
};
export const embedReward = (
  name: string,
  action: string,
  data?: any
): EmbedProps[] => {
  return [
    {
      color: getRandomColor(),
      title:
        (action == "new" ? "New " : action == "upd " ? "Update " : " ") + name,
      fields: [
        {
          name: "Name Reward",
          value: "",
          inputs: {
            id: `role_name`,
            type: EMessageComponentType.INPUT,
            component: {
              id: `reward-name`,
              placeholder: "Ex. Write something",
              required: true,
              textarea: true,
              defaultValue: data?.role_name || "",
            },
          },
        },

        {
          name: "Points:",
          value: "",
          inputs: {
            id: `point_threshold`,
            type: EMessageComponentType.INPUT,
            component: {
              id: `points`,
              placeholder: "Ex. number > 0",
              required: true,
              defaultValue: data?.point_threshold || 0,
              type: "number",
              step: 1,
            },
          },
        },
      ],
      timestamp: new Date().toISOString(),
      footer: MEZON_EMBED_FOOTER,
    },
  ];
};

export const components = (name: string, action: string, data?: any) => {
  return [
    {
      components: [
        {
          id: `cancel_${name}_${action}`,
          type: EMessageComponentType.BUTTON,
          component: {
            label: `Cancel`,
            style: EButtonMessageStyle.SECONDARY,
          },
        },
        {
          id: `submit_${name}_${action}_${data?.id}`,
          type: EMessageComponentType.BUTTON,
          component: {
            label: `Submit`,
            style: EButtonMessageStyle.SUCCESS,
          },
        },
      ],
    },
  ];
};
